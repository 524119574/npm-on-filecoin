'use strict'

import {Options} from "../server/server";
import fs = require('fs')


export const publish = (_config: Options, _app: any) => {
  return async (request:any, response:any, _next:any) => {
    const { _attachments, _versions } = request.body;
    const [firstAttachmentKey] = Object.keys(_attachments);
    console.log("first attachment key: ", firstAttachmentKey)
    
    fs.writeFile(
      firstAttachmentKey, 
      new Buffer(_attachments[firstAttachmentKey].data, 'base64'), () => {
        console.log("saved!")
      })

    response.statusCode = 201
    response.send({ok: "good", success: true, du: _versions});
  }
}