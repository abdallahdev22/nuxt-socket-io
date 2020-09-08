import { resolve as pResolve } from 'path'
import { createReadStream } from 'fs'

export default function(socket, io) {
  return {
    '~~sampleImage'({ stream, data }) {
      const filename = pResolve('./server/sample.jpg')
      createReadStream(filename).pipe(stream)
    },
    'hello'(msg) {
      return 'hello from server!'
    }
  }
}
