var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var doSimpleLogic = require('./movement.js')


const players = {},
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
    maxFrameIndex = 60/ 2* 60* 60,
    initFrame = { //each logic frame & each player
        // position
        x: 0,
        y: 0,
        z: 0,

        // speed
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: .6,

        // action
        lastX: 'right',
        lastY: 'down',
        motion: 'idel',
        jumping: false,
        actionCounter: 0,
        attackCounter: 0,
        dashCounter: 0,

        // ability
        speedDown: .4,
        actionCoolDown: 10,
        attackCoolDown: 20,
        dashCoolDown: 10,

        //status
        HP: 100,
        maxHP: 100,
        MP: 60,
        maxMP: 60
    }

let nextLogicFrameControl = {},
    nextLogicFrame = {},
    currentLogicFrame = {},
    currentFrameIndex

io.on('connection', client => {
    client.emit('init_client', {currentFrameIndex, fpsRadio, nextLogicFrame, players})

    client.on('create_current_player', ({name, charactor}) =>{
        let id = generateID(name, charactor)
        players[id] = {name, charactor}
        nextLogicFrame[id] = initFrame
        client.emit('is_creating', id)
        client.on('get_ready', () => {
            io.emit('create_player', id, name, charactor, nextLogicFrame[id])
        })
    })

    client.on('control_event', (id, keys) => {
        // console.log(id+ '  ' +keys.up)
        nextLogicFrameControl[id] = keys
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
        currentFrameIndex ++
        Object.keys(players).forEach(id => {
            if(nextLogicFrameControl[id] == undefined){
                nextLogicFrameControl[id] = {}
            }
        })
        io.emit('update_frame', currentFrameIndex, nextLogicFrameControl)

        currentLogicFrame = nextLogicFrame
        // Object.keys(currentLogicFrame).forEach((id) => {
        //     console.log(id + ' : ' + currentLogicFrame[id].x)
        // })

        nextLogicFrame =
                doSimpleLogic(currentLogicFrame, nextLogicFrameControl)

        // Object.keys(nextLogicFrame).forEach((id) => {
        //     console.log(id + ' : ' + nextLogicFrame[id].x+ ' : ' +nextLogicFrameControl[id].right)
        // })
        nextLogicFrameControl = {}
    }, 1000 / 60 * fpsRadio)
})

function generateID(name, charactor) {
    return name + '_' + new Date().getMilliseconds() + '_' + charactor
}