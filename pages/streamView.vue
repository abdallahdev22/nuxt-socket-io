<template>
  <div>
    Presenter's screen:
    <input type="checkbox" v-model="showVideo">Show Screen</input>
    <video v-if="showVideo"  preload="none"
      v-show-video="showVideo" id="video" :src="uri" type="video/webm" xautoplay >
    </video>
  </div>
</template>

<script>
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
          elm.play()
        });
        if (binding.value === true) {
          context.socket.on('dataURI', ({ uri, t }) => {
            elm.pause()
            context.uri = uri
            elm.currentTime = t
            // elm.play()
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