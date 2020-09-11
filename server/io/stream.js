import http from 'http'
import { resolve as pResolve } from 'path'
import { createReadStream } from 'fs'

export default function(socket, io) {
  return {
    '~~sampleImage'({ stream, data }) {
      const filename = pResolve('./server/sample.jpg')
      createReadStream(filename).pipe(stream)
    },
    hello(msg) {
      return 'hello from server!'
    },
    chunk: (buf) => socket.broadcast.emit('chunk', buf),
    start: (msg) => socket.broadcast.emit('start'),
    stop: (msg) => socket.broadcast.emit('stop')
  }
}
