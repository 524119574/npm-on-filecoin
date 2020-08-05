#! /usr/bin/env node

'use strict'

import { Options, startServer } from "./server/server"
import { argv } from "process"
import { readFileSync, existsSync, unlinkSync, writeFileSync, renameSync } from "fs"
import { parse, stringify} from "comment-json"
import { createPow } from "@textile/powergate-client";
import rc from 'rc'


require('dnscache')({ enable: true })

const { spawn } = require('child_process')
const { tarball } = require('tarball-extract')


const yargs = require('yargs').config(rc("npm-on-filecoin", null, {}));

const cleanUpOps : Array<() => Promise<void>> = []

const cleanUp = () => {
  Promise.all(
    cleanUpOps.map(op => op())
  ).then(() => process.exit(0))
}

process.on('SIGTERM', cleanUp)
process.on('SIGINT', cleanUp)

const proxyCommand = async (options: Options) => {
  console.info('👩‍🚀 Starting local proxy!') // eslint-disable-line no-console

  const server = await startServer(options)

  cleanUpOps.push(() => {
    return new Promise((resolve) => {
      server.close(() => {
        console.info('✋ Server stopped') // eslint-disable-line no-console
        resolve()
      })
    })
  })

  const packageManager = 'npm'

  console.info(`🎁 Installing dependencies with ${packageManager}`) // eslint-disable-line no-console
  const setRegistry = `--registry=http://localhost:${options.httpPort}`;

  const proc = spawn(packageManager, [setRegistry].concat(process.argv.slice(2)), {
    stdio: 'inherit'
  })

  proc.on('close', async (code:number) => {
    console.log(`🎁 ${packageManager} exited with code ${code}`) // eslint-disable-line no-console
    if (existsSync("packageOld.json")) {
      unlinkSync("package.json")
      renameSync("packageOld.json", "package.json")
    }
    process.exit(code)
  })

}

const setUpOptions = (yargs: any) => { // eslint-disable-line no-unused-expressions
    yargs
      .option('ipfs-registry', {
        describe: 'Where to download manifest if it is not in local MFS.',
        default: 'https://registry.js.ipfs.io',
        type: 'string',
      })
}

const wrapperCommand = async (options: Options) => {
  const commands = process.argv.slice(2)
  if (commands[0] === 'install') {
    console.log("argv 1", argv, commands)
    await installCommand(options);
    return
  }
  await proxyCommand(options)
}

const installCommand = async (_options: Options) => {
  const pkgJsonOld = parse(readFileSync('package.json').toString())
  const pkgJsonNew = parse(readFileSync('package.json').toString())
  const protocol = "fil://"

  for (const depType of ["dependencies", "devDependencies"]) {
    for (const pkgName in pkgJsonOld[depType]) {
      const val:string = pkgJsonOld[depType][pkgName]
      if (val.startsWith(protocol)) {
        const cidAndToken:string = val.replace(protocol, "");
        const parts = cidAndToken.split("+");
        const cid = parts[0];
        const token = parts[1];
        const host = "http://0.0.0.0:6002" // or whatever powergate instance you want
        const pow = createPow({ host });
        pow.setToken(token);
        const bytes = await pow.ffs.get(cid);
        const tarballPath = './tmp/' + pkgName + '.tgz'
        const tmpPkgPath = './tmp/' + pkgName
        const finalPkgPath = 'node_modules/' + pkgName
        writeFileSync(tarballPath, bytes, 'binary');
        console.log("extracted!!!");

        await tarball.extractTarball(tarballPath, tmpPkgPath, function(err:any) {
          if (err) {
            console.log(err);
          }
          if (existsSync(tmpPkgPath + '/package') && !existsSync(finalPkgPath)) {
            renameSync(tmpPkgPath + '/package', finalPkgPath);
          }
          if (existsSync(tarballPath)) {
            unlinkSync(tarballPath);
          }
        })
        delete pkgJsonNew[depType][pkgName]
      }
    }
  }

  renameSync('package.json', 'packageOld.json')
  writeFileSync("package.json", stringify(pkgJsonNew))
}

yargs.command(
  '$0', 'Installs your js dependencies using IPFS and Filecoin',
  setUpOptions, wrapperCommand).argv;

export const addOne = (n:number): number => n + 1




