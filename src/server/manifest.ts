'use strict'

import {Options} from "../server/server";
import fetch from 'node-fetch';

// interface Package {
//     name: string;
//     versions: Map<Number, string>;

// }

// const replaceTarballUrls = (pkg: any, config: Options):any => {
//   const prefix = `http://localhost:${config.httpPort}`
//   const packageName = pkg.name
//   const moduleName = packageName.startsWith('@') ? packageName.split('/').pop() : packageName

//   // change tarball URLs to point to us
//   Object.keys(pkg.versions || {})
//     .forEach(versionNumber => {
//       const version = pkg.versions[versionNumber]

//       version.dist.tarball = `${prefix}/${packageName}/-/${moduleName}-${versionNumber}.tgz`
//     })

//   return pkg
// }

export const manifest = (config: Options, _app: any) => {
  return async (request:any, response:any, _next:any) => {
    console.log("manifest", request.path)

    let moduleName = sanitiseName(request.path)

    console.info(`Loading manifest for ${moduleName}`)

    try {
      const manifest = await loadManifest(config, moduleName)
      response.statusCode = 200
      response.setHeader('Content-type', 'application/json; charset=utf-8')
      response.json(manifest)
      console.info("sent")
    } catch (error) {
      console.error(`💥 Could not load manifest for ${moduleName}`, error) // eslint-disable-line no-console

      if (error.message.includes('Not found')) {
        response.statusCode = 404
        console.info("package not found")

        return
      }

      // a 500 will cause the npm client to retry
      response.statusCode = 500
      response.send(lol(`💥 ${error.message}`))
    }
  }
}

const lol = (message: string) => {
    return `<marquee><font size=50>${message}</font></marquee>`
}


const sanitiseName = (name:string) : string => {
  name = `${(name || '').trim()}`.replace(/^(\/)+/, '/')

  if (name.startsWith('/')) {
    name = name.substring(1)
  }
  
  // Revert the URL encoding for `/`
  if (name.startsWith('@')) {
    name = name.replace(/%2f/g, '/')
  }

  return name
}

const loadManifest = async (_options: Options, _packageName:string) : Promise<JSON> => {

  return new Promise((resolve, _reject) => {
    (async () => {
      const response = await fetch('https://registry.js.ipfs.io/' + _packageName);
      const json = await response.json();   
      resolve(json)
    })();
  })
}