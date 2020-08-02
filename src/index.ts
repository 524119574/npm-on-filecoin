#! /usr/bin/env node

'use strict'

import { Options, startServer } from "./server/server"
import { argv } from "process"
import { readFileSync, writeFile, rename, existsSync, unlinkSync } from "fs"
import { parse, stringify} from "comment-json"
import { createPow } from "@textile/powergate-client";


require('dnscache')({ enable: true })

const rc = require('rc')
const { spawn } = require('child_process')

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

  console.info('👩‍🚀 Starting local proxy') // eslint-disable-line no-console

  const server = await startServer(options)

  cleanUpOps.push(() => {
    return new Promise((resolve) => {
      server.close(() => {
        console.info('✋ Server stopped') // eslint-disable-line no-console
        resolve()
      })
    })
  })

  const packageManager = '/usr/local/bin/npm'

  console.info(`🎁 Installing dependencies with ${packageManager}`) // eslint-disable-line no-console
  const setRegistry = `--registry=http://localhost:${options.httpPort}`;

  const proc = spawn(packageManager, [setRegistry].concat(process.argv.slice(2)), {
    stdio: 'inherit'
  })

  proc.on('close', async (code:number) => {
    console.log(`🎁 ${packageManager} exited with code ${code}`) // eslint-disable-line no-console
    if (existsSync("packageOld.json")) {
      unlinkSync("package.json")
      rename("packageOld.json", "package.json", (e) => console.log(e))
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
  console.log("argv", argv, commands)
  if (commands[0] === 'install') {
    const pkgJsonOld = parse(readFileSync('package.json').toString())
    const pkgJsonNew = parse(readFileSync('package.json').toString())
  
    for (const prop in pkgJsonOld.dependencies) {
      if (pkgJsonOld.dependencies[prop].startsWith("fil://")) {
        const v:string = pkgJsonOld.dependencies[prop]
        console.log(v);
        console.log(typeof v);
        const cidAndToken:string = v.replace("fil://", "");
        console.log("cid", cidAndToken);
        const parts = cidAndToken.split("+");
        const cid = parts[0];
        const token = parts[1];
        const host = "http://0.0.0.0:6002" // or whatever powergate instance you want
        const pow = createPow({ host });
        pow.setToken(token);
        const bytes = await pow.ffs.get(cid);
        console.log(bytes.length);
        const len = bytes.length;
        const b = Buffer.alloc(len);
        for (let i = 0; i < len; i++) {
          b[i] = bytes[i];
        }
        console.log(b);
        writeFile("test1.tgz", b, 'binary', ()=> console.log());
        delete pkgJsonNew.dependencies[prop]
      }
    }

    for (const prop in pkgJsonOld.devDependencies) {
      if (pkgJsonOld.devDependencies[prop].startsWith("fil://")) {
        console.log(prop)
        delete pkgJsonNew.devDependencies[prop]
      }
    }
    rename('package.json', 'packageOld.json',(e) => console.log(e))
    writeFile("package.json", stringify(pkgJsonNew), (e) => console.log(e))
  }
  proxyCommand(options)
}

yargs.command(
  '$0', 'Installs your js dependencies using IPFS and Filecoin',
  setUpOptions, wrapperCommand).argv;




