import express from "express";
import once from 'once';
import { AddressInfo } from "net";
import {manifest} from "../server/manifest"
import {publish} from "../server/publish"
import bodyParser from 'body-parser';


export interface Options {
    httpPort: number,

}

export interface Server {
    close: any
}

export const startServer = async (options: Options):Promise<Server> => {
    const app = express()

    app.use(bodyParser.json({ strict: false, limit: '10mb'}));
  
    // // intercept requests for tarballs and manifests
    // app.get('/*.tgz', tarball(options, app))
    app.get('/*', manifest(options, app));
    app.put('/*', publish(options, app))
  
    // // everything else should just proxy for the registry
    // const registry = proxy(options.registry)
    // app.put('/*', registry)
    // app.post('/*', registry)
    // app.patch('/*', registry)
    // app.delete('/*', registry)
  
    // app.locals.ipfs = startIpfs(options)
  
    return new Promise((resolve, reject) => {
      const callback = once((error:any) => {
        if (error) {
          reject(error);
        }
  
        if (!options.httpPort) {
          const address = server.address();
          if (typeof address == "string") {
            reject("it needs to be bound to a TCP socket")
          }
          options.httpPort = (<AddressInfo> address).port
        }
  
        console.info(`🚀 Server running on port ${options.httpPort}`) // eslint-disable-line no-console
  
        resolve(server)
      })
  
      let server = app.listen(options.httpPort, callback)
      server.once('error', callback)
    })
  }