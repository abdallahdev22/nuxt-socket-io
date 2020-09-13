<template>
  <div>
    <div>
      <label>Presenter's screen:</label>
      <input v-model="showVideo" type="checkbox"> Show Screen</input>
    </div>
    <video id="video" v-if="showVideo" v-show-video autoplay />

  </div>
</template>

<script>
const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function initVideo(video, mimeCodec, cb) {
  return new Promise((resolve, reject) => {
    if ('MediaSource' in window 
      && MediaSource.isTypeSupported(mimeCodec)) {
      const mediaSource = new MediaSource;
      video.src = URL.createObjectURL(mediaSource);
      mediaSource.addEventListener('sourceopen', function() {
        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        resolve({ sourceBuffer, mediaSource })
      })
    } else {
      reject(new Error(`Unsupported MIME type or codec: ${mimeCodec}`))
    }
  })
}

export default {
  directives: {
    showVideo: {
      inserted(elm, binding, { context }) {
        const { streamInfo } = context
        const { mimeCodec } = streamInfo
        const video = elm
        const info = {}
        
        const socket = context.$nuxtSocket({ 
          channel: '/stream'
        })

        function stop() {
          return new Promise(async (resolve) => {
            function endOfStream() {
              if (info.mediaSource.readyState === 'open') {
                info.mediaSource.endOfStream();
              }
              info.sourceBuffer.removeEventListener('updateend', endOfStream, true)
              resolve()
            }
            info.sourceBuffer.addEventListener('updateend', endOfStream)
            await delay(1000)
            endOfStream()
          })
        }
        async function start() {
          Object.assign(info, await initVideo(video, mimeCodec))
        }
        video.onerror = async (evt) => {
          console.error('video elm error', evt.target.error)
          await stop()
          await delay(1000)
          await start()
          console.log('retry....')
        }
        socket
          .on('chunk', (bufIn) => {
            console.log('bufIn', bufIn.byteLength)
            if (!video.error 
              && info.mediaSource.readyState === 'open' 
              && info.sourceBuffer 
              && !info.sourceBuffer.updating) {
              info.sourceBuffer.appendBuffer(bufIn)
              if (info.sourceBuffer.buffered.length > 0) {
                console.log('sourceBuffer', info.sourceBuffer.buffered.end(0))
              }
            }
          })
          .on('start', start)
          .on('stop', stop)

        start()
      }
    }
  },
  data() {
    return {
      showVideo: false,
      streamInfo: {
        mimeCodec: "video/webm; codecs=vp9"
      }
    }
  }
}
</script>

<style scoped>
#video {
  border: 1px solid #999;
  width: 98%;
  max-width: 860px;
}
</style>