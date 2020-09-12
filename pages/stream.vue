<template>
  <div>
    <div>
      <button @click="startCapture()" class="btn btn-primary">Start</button>
      <button @click="stopCapture()" class="btn btn-primary">Stop</button>
    </div>
    <video id="video" v-screen-view autoplay />

    Ready to receive image!
    <button @click="getImage()" class="btn btn-primary">
      Get Sample Image
    </button>
    <img id="image" :src="imageData" />
  </div>
</template>

<script>
export default {
  directives: {
    screenView: {
      inserted(elm, binding, { context }) {
        context.video = elm
      }
    }
  },
  data() {
    return {
      displayMediaOptions: {
        video: {
          cursor: 'always'
        },
        audio: false
      },
      recordingOptions: {
        mimeType: 'video/webm; codecs=vp9',
        period: 1000
      },
      video: '',
      imageData: ''
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/stream'
    })
  },
  methods: {
    getImage() {
      let imageBytes = new Uint8Array()
      const { stream, socket } = this.$nuxtSocket({
        channel: '/stream',
        socketStream: {
          evt: '~~sampleImage',
          filename: 'sample.jpg'
        }
      })
      socket.emit('hello', { data: 123 }, (resp) => {
        // eslint-disable-next-line no-console
        console.log('hello resp rxd!', resp)
      })
      stream
        .on('data', (d) => {
          imageBytes = [...imageBytes, ...d]
        })
        .on('end', () => {
          const imgStr = btoa(String.fromCharCode(...imageBytes))
          this.imageData = `data:image/jpg;base64, ${imgStr}`
        })
    },
    async startCapture() {
      try {
        const { displayMediaOptions, video } = this
        const captureStream = await navigator.mediaDevices.getDisplayMedia(
          displayMediaOptions
        )
        video.srcObject = captureStream
        this.startRecording(captureStream)
      } catch (err) {
        console.error('Error: ' + err)
      }
    },
    startRecording(captureStream) {
      const { recordingOptions, socket } = this
      const { mimeType, period } = recordingOptions
      const mediaRecorder = new MediaRecorder(captureStream, { mimeType })
      mediaRecorder.ondataavailable = async function(event) {
        const buf = await event.data.arrayBuffer()
        if (buf.byteLength > 0) {
          socket.emit('chunk', buf)
        }
      }

      mediaRecorder.onstop = function() {
        clearInterval(timer)
      }
      mediaRecorder.start()
      socket.emit('start')

      const timer = setInterval(() => {
        mediaRecorder.requestData()
      }, period)
    },
    stopCapture() {
      const { socket, video } = this
      const tracks = video.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      video.srcObject = null
      socket.emit('stop')
    }
  }
}
</script>

<style scoped>
#video,
#video2 {
  border: 1px solid #999;
  width: 98%;
  max-width: 860px;
}
</style>
