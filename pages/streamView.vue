<template>
  <div>
    Presenter's screen:
    <input type="checkbox" v-model="showVideo">Show Screen</input>
    <br />
    <video xv-if="showVideo"  preload="none"
      xv-show-video="showVideo" id="video" :src="uri" type="video/webm" autoplay />

  </div>
</template>

<script>
function stream(mimeCodec, cb) {
  const video = document.getElementById('video')
  console.log('stream', mimeCodec)
  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    var mediaSource = new MediaSource;
    //console.log(mediaSource.readyState); // closed
    var url = URL.createObjectURL(mediaSource)
    video.src = url // URL.createObjectURL(mediaSource);
    console.log('src now!', url)
    mediaSource.addEventListener('sourceopen', function() {
      // console.log('source open')
      
      var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
      sourceBuffer.addEventListener('updateend', function (_) {
        mediaSource.endOfStream();
      })
      video.play()
      cb(url, sourceBuffer)
    })
    // mediaSource.addEventListener('sourceopen', sourceOpen);
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec);
  }
}


export default {
  directives: {
    showVideo: {
      inserted(elm, binding, { context }) {
        // elm.canplay = function() {
        //   console.log('yea!')
        // }
        elm.addEventListener('canplay', (event) => {
          console.log('Yay! The readyState just increased to  ' + 
              'HAVE_CURRENT_DATA or greater for the first time.');
          // elm.play()
        });
        if (binding.value === true) {
          context.socket.on('dataURI', ({ uri, t }) => {
            console.log('uri rxd!', uri)
            // elm.pause()
            context.uri = uri
            // elm.currentTime = t
            elm.play()
          })
        } 
      }
    }
  },
  data() {
    return {
      uri: '',
      showVideo: false
    }
  },
  mounted() {
    let _sourceBuffer
    stream('video/webm; codecs=vp9', (uri, sourceBuffer) => {
      _sourceBuffer = sourceBuffer  
    })

    let cnt = 0
    this.socket = this.$nuxtSocket({ 
      channel: '/stream'
    }).on('dataURI', ({ uri, t }) => {
      console.log('uri rxd!', uri)
      // elm.pause()
      // this.uri = uri
      // elm.currentTime = t
      // elm.play()
    }).on('chunk', (buf) => {
      if (_sourceBuffer) {
        _sourceBuffer.appendBuffer(buf);
        console.log('_sourceBuffer', _sourceBuffer)
      }
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