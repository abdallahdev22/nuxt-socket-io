<template>
  <div>
    <div>
      <label>Presenter's screen:</label>
      <input v-model="showVideo" type="checkbox"> Show Screen</input>
    </div>
    <video id="video" v-if="showVideo" v-show-video type="video/webm" autoplay />

  </div>
</template>

<script>
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
        // eslint-disable-next-line handle-callback-err
        video.addEventListener('error', (error) => {
          /* Error because stream is changing */
        })
        const socket = context.$nuxtSocket({ 
          channel: '/stream'
        })
        async function updateInfo() {
          Object.assign(info, await initVideo(video, mimeCodec))
        }
        updateInfo()
        socket
          .on('chunk', (bufIn) => {
            if (info.sourceBuffer && !info.sourceBuffer.updating) {
              info.sourceBuffer.appendBuffer(bufIn)
            }
          })
          .on('start', updateInfo)
          .on('stop', () => {
            function endOfStream() {
              info.mediaSource.endOfStream();
              info.sourceBuffer.removeEventListener('updateend', endOfStream, true)
              info.sourceBuffer = false
            }
            info.sourceBuffer.addEventListener('updateend', endOfStream)
          })
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