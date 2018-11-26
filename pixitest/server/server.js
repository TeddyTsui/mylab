var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

const players = [],
    operation = {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        jump: false,
        dash: false
    },
    fpsRadio = 2,
    maxFrameIndex = 60/ 2* 60* 60

let nextLogicFrame = {},
    currentFrameIndex

io.on('connection', client => {
    client.emit('inti_client', {currentFrameIndex, fpsRadio, players})

    client.on('create_player', (id, name, charactor) =>{
        players[id] = {name, charactor}
        io.emit('create_player', {id, name, charactor})
    })

    client.on('control_evnent', (id, keys) => {
        nextLogicFrame[id] = keys
    })

    client.on('disconnect', () => {
        console.log('a user disconnected')
    })
    console.log('a user connected')
})

http.listen(3000, () => {
    console.log('listening on *:3000')
    currentFrameIndex = 0
    let ticker = setInterval(() => {
        Object.keys(player).forEach(id => {
            if(nextLogicFrame[id] == undefined){
                nextLogicFrame[id] = operation
            }
        })
        io.emit('updateFrame', nextLogicFrame)
        nextLogicFrame = {}
    }, 1000 / 60 * fpsRadio)
})
