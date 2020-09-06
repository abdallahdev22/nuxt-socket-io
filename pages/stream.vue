<template>
  <div>
    Ready to receive image!
    <img :src="imageData" />
  </div>
</template>

<script>
import ss from 'socket.io-stream'

export default {
  data() {
    return {
      imageData: ''
    }
  },
  mounted() {
    const stream = ss.createStream()
    const filename = 'profile.jpg'
    let imageBytes = new Uint8Array()
    this.socket = this.$nuxtSocket({ channel: '/stream' })
    ss(this.socket).emit('sample-image', stream, { name: filename })
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
