#! /usr/bin/env node

'use strict'

import { Options, startServer } from "./server/server"
import { readFileSync, existsSync, unlinkSync, writeFileSync, renameSync, mkdirSync, createReadStream } from "fs"
import { parse, stringify} from "comment-json"
import { createPow } from "@textile/powergate-client";
import { dirname } from 'path'
import {createGunzip} from 'zlib'
import {Extract} from 'tar'
import rc from 'rc'
import {cwd} from 'process'
import { execSync } from 'child_process';
import { tmpdir } from 'os'


require('dnscache')({ enable: true })

const { spawn } = require('child_process')


const yargs = require('yargs').config(rc("npm-on-filecoin", null, {}));

const cleanUpOps : Array<() => Promise<void>> = []

const tmpDir_ = tmpdir();
const tmpPkgJsonPath = tmpDir_ + '/packageOld.json';
const pkgJsonPath = cwd() + "/package.json";
const nodeModulePath = cwd() + "/node_modules/"

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
    stdio: 'inherit',
    cwd: cwd()
  })

  proc.on('close', async (code:number) => {
    revertPackageChange()
    console.log(`🎁 ${packageManager} exited with code ${code}`) // eslint-disable-line no-console
    process.exit(code)
  })

  proc.on('error', async (_code:number) => {
    revertPackageChange()
  })

}

// Note
const revertPackageChange = () => {
  if (existsSync(tmpPkgJsonPath)) {
    unlinkSync(pkgJsonPath)
    renameSync(tmpPkgJsonPath, pkgJsonPath)
    ensureDirectoryExist(nodeModulePath + 'dummy.txt')
    execSync(`mv ${tmpDir_}/node_modules/* ${nodeModulePath}`)
  }
}

const setUpOptions = (yargs: any) => { // eslint-disable-line no-unused-expressions
    yargs
      .option('ipfs-registry', {
        describe: 'Where to download manifest if it is not in local MFS.',
        default: 'https://registry.js.ipfs.io',
        type: 'string',
      })
}

const ensureDirectoryExist = (filePath: string) => {
  const dn:string = dirname(filePath);
  if (existsSync(dn)) {
    return;
  }
  ensureDirectoryExist(dn);
  mkdirSync(dn);
}

const wrapperCommand = async (options: Options) => {
  const commands = process.argv.slice(2)
  if (commands[0] === 'install') {
    await installFilDependencies(options);
  }

  await proxyCommand(options);
}

const installFilDependencies = async (_options: Options) => {
  const pkgJsonOld = parse(readFileSync(pkgJsonPath).toString())
  const pkgJsonNew = parse(readFileSync(pkgJsonPath).toString())
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
        const tarballPath = tmpDir_ + '/' + pkgName + '.tgz'
        const tmpPkgPath = tmpDir_ + '/node_modules/' + pkgName
        ensureDirectoryExist(tarballPath);
        writeFileSync(tarballPath, bytes, 'binary');

        extractTgz(tarballPath, tmpPkgPath, function(err:any) {
          if (err) {
            console.log(err);
          }
          if (existsSync(tarballPath)) {
            unlinkSync(tarballPath);
          }
          console.log(`Installed ${pkgName} via filecoin.`)
        })
        delete pkgJsonNew[depType][pkgName]
      }
    }
  }

  ensureDirectoryExist(tmpPkgJsonPath);
  renameSync(pkgJsonPath, tmpPkgJsonPath);
  writeFileSync(pkgJsonPath, stringify(pkgJsonNew));
}

yargs.command(
  '$0', 'Installs your js dependencies using IPFS and Filecoin',
  setUpOptions, wrapperCommand).argv;

const extractTgz = (sourceFile:string, destination:string, callback:any) => {
    // This file is gzipped, use zlib to deflate the stream before passing to tar.
    createReadStream(sourceFile)
    .pipe(createGunzip())
    .pipe(Extract({ path: destination}))
    .on('error', async function(er: any) { await callback(er)})
    .on("end", async function() { await callback(null)})
}
