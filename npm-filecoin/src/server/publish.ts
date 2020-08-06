'use strict'

import {Options} from "../server/server";
import { createPow } from "@textile/powergate-client";
import { JobStatus } from "@textile/grpc-powergate-client/dist/ffs/rpc/rpc_pb"
import { writeFileSync, readFileSync } from "fs";

export const publish = (_config: Options, _app: any) => {
  return async (request:any, response:any, _next:any) => {
    const { _attachments, _versions } = request.body;
    const [firstAttachmentKey] = Object.keys(_attachments);
    console.log("first attachment key: ", firstAttachmentKey)

    const host = "http://0.0.0.0:6002" // or whatever powergate instance you want

    const pow = createPow({ host })
    const { token } = await pow.ffs.create(); // save this token for later use!
    pow.setToken(token);
    writeFileSync(firstAttachmentKey, new Buffer(_attachments[firstAttachmentKey].data, 'base64'));
    const buffer = readFileSync(firstAttachmentKey);
    const { cid } = await pow.ffs.stage(buffer);
    const { jobId } = await pow.ffs.pushStorageConfig(cid)
    // watch the FFS job status to see the storage process progressing
    pow.ffs.watchJobs((job) => {
      if (job.status === JobStatus.JOB_STATUS_CANCELED) {
        console.log("job canceled")
      } else if (job.status === JobStatus.JOB_STATUS_FAILED) {
        console.log("job failed")
      } else if (job.status === JobStatus.JOB_STATUS_SUCCESS) {
        console.log("job success!")
      }
    }, jobId)

    console.log(`Uploaded to powergate, cid: ${cid}, token: ${token}`);
    response.statusCode = 201
    response.send({ok: "good", success: true, du: _versions});
  }
}
