<template>
  <div>
    Ready to receive image!
    <img id="image" :src="imageData" />
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
    const filename = 'profile.jpg'
    let imageBytes = new Uint8Array()
    const { stream, socket } = this.$nuxtSocket({ 
      channel: '/stream', 
      socketStream: '~~sampleImage' 
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
  }
}
</script>
