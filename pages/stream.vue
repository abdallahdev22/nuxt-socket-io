<template>
  <div>
    <div>
      <button class="btn btn-primary" @click="startCapture()">Start</button>
      <button class="btn btn-primary" @click="stopCapture()">Stop</button> 
    </div>
    <video id="video" v-screen-view autoplay />

    Ready to receive image!
    <button class="btn btn-primary" @click="getImage()">Get Sample Image</button>
    <img id="image" :src="imageData" />
  </div>
</template>

<script>
export default {
  directives: {
    screenView: {
      inserted(elm, binding, { context }) {
        context.video = elm
        console.log('video elm set', context.video)
      }
    }
  },
  data() {
    return {
      displayMediaOptions: {
        video: {
          cursor: "always"
        },
        audio: false
      },
      recordingOptions: {
        mimeType: "video/webm; codecs=vp9",
        period: 100
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
        const captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        video.srcObject = captureStream
        this.startRecording(captureStream)
      } catch(err) {
        console.error("Error: " + err);
      }
    },
    startRecording(captureStream) {
      const { recordingOptions, socket } = this
      const { mimeType, period } = recordingOptions
      const mediaRecorder = new MediaRecorder(captureStream, { mimeType })
      mediaRecorder.ondataavailable = async function(event) {
        const buf = await event.data.arrayBuffer()
        socket.emit('chunk', buf)
      }

      const timer = setInterval(() => {
        mediaRecorder.requestData()
      }, period)

      mediaRecorder.onstop = function() {
        clearInterval(timer)
      }
      mediaRecorder.start();
    },
    stopCapture() {
      const { video } = this
      let tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  }
}
</script>

<style scoped>
#video, #video2 {
  border: 1px solid #999;
  width: 98%;
  max-width: 860px;
}
</style>