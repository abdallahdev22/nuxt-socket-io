<template>
  <div>
    <div>
      <button class="btn btn-primary" @click="startCapture()">Start</button>
      <button class="btn btn-primary" @click="stopCapture()">Stop</button>
    </div>
    <video id="video" autoplay />

    Streamed:
    <video id="video2" autoplay />
    <!-- <video id="video2" autoplay /> -->

    Ready to receive image!
    <button class="btn btn-primary" @click="getImage()">Get Sample Image</button>
    <img id="image" :src="imageData" />
  </div>
</template>

<script>

function stream(mimeCodec, cb) {
  const video = document.getElementById('video2')
  console.log('stream', mimeCodec)
  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    var mediaSource = new MediaSource;
    //console.log(mediaSource.readyState); // closed
    var url = URL.createObjectURL(mediaSource)
    // video.src = URL.createObjectURL(mediaSource);
    console.log('src now!', url)
    // mediaSource.addEventListener('sourceopen', function() {
      // console.log('source open')
      var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
      // sourceBuffer.addEventListener('updateend', function (_) {
      //   mediaSource.endOfStream();
      // })
      cb(url, sourceBuffer)
    // })
    // mediaSource.addEventListener('sourceopen', sourceOpen);
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec);
  }
}

// function sourceOpen (_) {
//   console.log('ready state', this.readyState); // open
//   var mediaSource = this;
//   var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
//   fetchAB(assetURL, function (buf) {
//     sourceBuffer.addEventListener('updateend', function (_) {
//       mediaSource.endOfStream();
//       video.play();
//       console.log(mediaSource.readyState); // ended
//     });
//     sourceBuffer.appendBuffer(buf);
//   });
// }


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
      let _sourceBuffer

      // stream(options.mimeType, (uri, sourceBuffer) => {
      //   _sourceBuffer = sourceBuffer
      //   console.log('EMIT dataURI', uri, sourceBuffer)
      //   socket.emit('dataURI', { uri })
      // })

      const mediaRecorder = new MediaRecorder(captureStream, options)
      const video2 = document.getElementById('video2')
      const recordedChunks = []
      let t = 0

      mediaRecorder.ondataavailable = async function(event) {
        // if (_sourceBuffer) {
        //   // console.log('buffer...', _sourceBuffer)
          const buf = await event.data.arrayBuffer()
          socket.emit('chunk', buf)
        //   console.log('append buf', buf)
        //   _sourceBuffer.appendBuffer(buf);
        // }
        // return


        const chunk = event.data
        if (chunk.size > 0) {
          recordedChunks.push(chunk)
          const blob = new Blob(recordedChunks, {
            type: "video/webm"
          });

          // const uri = URL.createObjectURL(blob);
          // socket.emit('dataURI', { uri, t })
          // t++
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