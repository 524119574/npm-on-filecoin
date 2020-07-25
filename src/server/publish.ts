'use strict'

import {Options} from "../server/server";
import fs = require('fs')


export const publish = (_config: Options, _app: any) => {
  return async (request:any, response:any, _next:any) => {
    const packageName = request.params;
    // const body = request.body;
    // console.log("request is: ", request)
    console.log("package name is: ", packageName)
    console.log("remote user is: ", request.remote_user)
    const { _attachments, _versions } = request.body;
    const [firstAttachmentKey] = Object.keys(_attachments);
    // console.log("req: ", _attachments);
    console.log("first attachment key: ", firstAttachmentKey)
    
    // fs.writeFile('')

    response.statusCode = 201
    response.send({ok: "good", success: true, du: _versions});
    // next({ok: "good", success: true})
  }
}