import { resolve as pResolve } from 'path'
import { createReadStream } from 'fs'
import ss from 'socket.io-stream'

export default function(socket, io) {
  ss(socket).on('sample-image', (stream, data) => {
    const filename = pResolve('./server/sample.jpg')
    createReadStream(filename).pipe(stream)
  })

  return {}
}
