<template>
  <div>
    Ready to receive image!
    <button class="btn btn-primary" @click="getImage()">Get Sample Image</button>
    <img id="image" :src="imageData" />

    <button class="btn btn-primary" @click="startCapture()">Start</button>
    <button class="btn btn-primary" @click="stopCapture()">Stop</button>
    <video id="video" autoplay />
    <!-- <video id="video2" autoplay /> -->
  </div>
</template>

<script>


export default {
  data() {
    return {
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
      const video = document.getElementById('video')
      const displayMediaOptions = {
        video: {
          cursor: "always"
        },
        audio: false
      }
      
      try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        video.srcObject = captureStream
        this.startRecording(captureStream)
      } catch(err) {
        console.error("Error: " + err);
      }
    },
    startRecording(captureStream) {
      const { socket } = this
      const options = { mimeType: "video/webm; codecs=vp9" }
      const mediaRecorder = new MediaRecorder(captureStream, options)
      const video2 = document.getElementById('video2')
      const recordedChunks = []
      let t = 0

      mediaRecorder.ondataavailable = function(event) {
        const chunk = event.data
        if (chunk.size > 0) {
          recordedChunks.push(chunk)
          const blob = new Blob(recordedChunks, {
            type: "video/webm"
          });
          const uri = URL.createObjectURL(blob);
          socket.emit('dataURI', { uri, t })
          t++
        }
      }

      const timer = setInterval(() => {
        mediaRecorder.requestData()
      }, 3000)

      mediaRecorder.onstop = function() {
        clearInterval(timer)
      }
      mediaRecorder.start();
    },
    stopCapture() {
      const video = document.getElementById('video')
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