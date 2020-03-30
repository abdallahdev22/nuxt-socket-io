/* Schemas */
const Item = {
  id: '',
  name: '',
  desc: ''
}

/* API */
const api = {
  version: 1.02,
  evts: {
    ignoreMe: {},
    someList: {
      methods: ['getList'],
      data: []
    },
    itemRxd: {
      methods: ['getItems', 'toBeAdded'],
      data: {
        progress: 0,
        item: {}
      }
    },
    msgRxd: {
      data: {
        date: new Date(),
        msg: ''
      }
    }
  },
  methods: {
    getItems: {
      resp: [Item]
    },
    getItem: {
      msg: {
        id: ''
      },
      resp: Item
    },
    noResp: {}
  }
}

/* SVC */
function Svc(socket) {
  return Object.freeze({
    getAPI(data) {
      console.log('getAPI', data)
      socket.emit('getAPI', {}, (clientApi) => {
        console.log('clientApi', clientApi)
        socket.emit(
          'receiveMsg',
          {
            date: new Date(),
            from: 'server1',
            to: 'client1',
            text: 'Hi client from server!'
          },
          (resp) => {
            console.log('receiveMsg response', resp)
          }
        )
        socket.on('warnings', (msg) => {
          console.log('warnings from client', msg)
        })
      })
      return Promise.resolve(api)
    },

    /* Methods */
    getItems() {
      const items = Array(4)
      let idx = 0
      return new Promise((resolve) => {
        const timer = setInterval(() => {
          items[idx] = {
            id: `item${idx}`,
            name: `Some Item ${idx}`,
            desc: `Some description ${idx}`
          }
          const item = items[idx]
          socket.emit('itemRxd', {
            method: 'getItems',
            data: {
              progress: ++idx / items.length,
              item
            }
          })
          socket.emit('itemRxd', {
            method: 'toBeDone',
            data: {}
          })
          if (idx >= items.length) {
            clearInterval(timer)
            resolve(items)
          }
        }, 500)
      })
    },
    getItem({ notify, id }) {
      console.log('received msg', id)
      const data = {
        date: new Date(),
        msg: id
      }
      socket.emit('msgRxd', { data }, (resp) => {
        console.log('ack received', resp)
      })
      const ItemOut = Object.assign(
        { ...Item },
        {
          id,
          name: 'Some Item',
          desc: 'Some description'
        }
      )
      return Promise.resolve(ItemOut)
    },
    noResp({ }) {
      return Promise.resolve({})
    }
  })
}

module.exports = {
  Svc
}
