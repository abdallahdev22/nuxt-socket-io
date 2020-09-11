<template>
  <div>
    <div>
      <label>Presenter's screen:</label>
      <input type="checkbox" v-model="showVideo"> Show Screen</input>
    </div>
    <video v-if="showVideo" v-show-video id="video" type="video/webm" autoplay />

  </div>
</template>

<script>
function stream(video, mimeCodec, cb) {
  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    const mediaSource = new MediaSource;
    video.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', function() {
      console.log('source open', mediaSource)
      var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
      // sourceBuffer.addEventListener('updateend', function (_) {
      //   console.log('end of stream!')
      //   mediaSource.endOfStream();
      // })
      // video.play()
      cb(sourceBuffer)
    })
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec);
  }
}

export default {
  directives: {
    showVideo: {
      inserted(elm, binding, { context }) {
        const { streamInfo } = context
        const { mimeCodec } = streamInfo
        const video = elm
        stream(video, mimeCodec, (sourceBuffer) => {
          context.socket.on('chunk', (bufIn) => {
            console.log('buf rxd', bufIn.byteLength)
            if (!sourceBuffer.updating) {
              sourceBuffer.appendBuffer(bufIn);
            }
          })
        })
      }
    }
  },
  data() {
    return {
      showVideo: false,
      streamInfo: {
        mimeCodec: "video/webm; codecs=vp9"
      },
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({ 
      channel: '/stream'
    })
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