import { keyboard } from './utils.js'
import { createSprite, playAnim } from './charactor.js'
import { doSimpleLogic } from './movement.js'

const initStatus = {
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
    motion: 'right_idle',
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


const controllConfig = {
    /**
     *  default
     *  wsaf jkl
     */
    up: 87,
    down: 83,
    left: 65,
    right: 68,
    attack: 74,
    jump: 75,
    dash: 76
}

// some var
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    AnimatedSprite = PIXI.extras.AnimatedSprite

let players = [] //local sprites

let app = undefined,
    socket,
    keys = {},
    state

let gameFrame,
    nextGameFrame,
    maxFrameCache = 60 * 60 * 60,
    fpsRadio = 2,
    localPlayerId,
    updateControlInterval

const updateCache = {},
    logicFrameCahce = {},
    logicFrameIndexArr = [],
    defaultDelay = 10


export function initClient(element, io, url) {

    let width = element.offsetWidth,
        height = element.offsetHeight

    app = new Application({ width: width, height: height })
    element.appendChild(app.view)

    // TODO add container { playground, UIlayer}
    // TODO initUI()

    socket = io(url)

    socket.on('init_client', ({ currentFrameIndex, fpsRadio, nextLogicFrame: initLogicFrame, players: playerList }) => {
        players = playerList
        fpsRadio = fpsRadio
        gameFrame = currentFrameIndex * fpsRadio
        nextGameFrame = gameFrame + fpsRadio
        logicFrameIndexArr.push(currentFrameIndex)
        logicFrameCahce[currentFrameIndex] = initLogicFrame
        // cache frame
        // how to init nextGameFrame
        loader.add('adventurer', 'sheet/adventurer/adventurer.json')
            .load(setup)
    })

    socket.on('create_player', ({ id, name, charactor, status }) => {
        console.log(id + ' : ' + name)
        initPlayer(id, {name, charactor, status })
    })

    socket.on('update_frame', (logicFrameIndex,keys) => {
        updateCache[logicFrameIndex] = keys
    })

    function setup() {
        // set up charactor ability
        resources.adventurer.baseAbilities = {
            actionCoolDown: 20,
            attackCoolDown: 40,
            dashCoolDown: 20
        }

        Object.keys(players).forEach(id => {
            initPlayer(id, players[id])
        })

        state = cacheFrame
        app.ticker.add(delta => gameLoop(delta))

        createPlayer('TEST', 'adventurer')
    }
}

function gameLoop(delta) {
    state(delta)
}

function cacheFrame(delta) {
    if (Object.keys(updateCache).length > defaultDelay) {
        state = play
        updateControlInterval = setInterval(updateControl, 1000 / 60 * fpsRadio)
    }
}

// let counter
function play(delta) {
    if (gameFrame > maxFrameCache) {
        gameFrame = 0
    } else {
        gameFrame += delta
    }
    // let index = Math.floor(delta / fpsRadio)
    let offset = delta % fpsRadio
    // console.log(gameFrame)
    // console.log(Math.floor(gameFrame / fpsRadio))
    let curFrameIndex = nextGameFrame/fpsRadio,
        prevFrameIndex = curFrameIndex - 1

    // gameFrame count greater than nextGameFrame then do logic
    if (gameFrame > nextGameFrame) {
        if (updateCache[curFrameIndex] !== undefined) {
            nextGameFrame += fpsRadio
            if (nextGameFrame > maxFrameCache) {
                nextGameFrame -= maxFrameCache
            }
            console.log(logicFrameCahce)
            console.log(prevFrameIndex + ' : ' +logicFrameCahce[prevFrameIndex])
            // do some Logic
            logicFrameCahce[curFrameIndex] =
                doSimpleLogic(logicFrameCahce[prevFrameIndex], updateCache[curFrameIndex])
            // console.log(logicFrameCahce[curFrameIndex])

            logicFrameIndexArr.push(curFrameIndex)
        } else {
            // send request get frameIndex operations
        }
    }

    // update game frame
    if (logicFrameIndexArr.length > 0) {
        // console.log(logicFrameCahce)
        // console.log(curFrameIndex)
        logicFrameIndexArr.find((frameIndex, i, self) => {
            if (frameIndex == curFrameIndex) {
                updateDispalyFrame(logicFrameCahce[frameIndex], offset)
                let pastFrame = self.splice(0, i)
                pastFrame.map((pastFrameIndex) => {
                    delete updateCache[pastFrameIndex]
                    delete logicFrameCahce[pastFrameIndex]
                })
                return true
            }
        })
    }
}

// calculate interpolation rendering
function updateDispalyFrame(logicFrame, offset) {
    console.log(logicFrame)
    Object.keys(players).forEach(id => {
        let { x, y, z } = logicFrame[id]

        players[id].x += (x - players[id].x) / fpsRadio * offset
        players[id].y += (y - players[id].y) / fpsRadio * offset
        let entity = players[id].getChildByName('entity')
        entity.y += (z - entity.y) / fpsRadio * offset

        playAnim(entity, logicFrame[id].motion, logicFrame[id].fromZero)
        logicFrame[id].fromZero = false
    })
}


// create a charactor for local player
function createPlayer(name, charactor, conf = controllConfig) {
    if (name == '') {
        return
    }

    socket.emit('create_player', { name, charactor })
    socket.on('create_success', (playerId) => {
        //let initFrameIndex = logicFrameIndexArr[-1]
        // logicFrameCahce[initFrameIndex][playerId] = initStatus
        localPlayerId = playerId
        logicFrameCahce[gameFrame/fpsRadio][playerId] = initStatus
        bindKey(conf)
    })
}

// init a charactor
function initPlayer(id, {name, charactor, status }) {
    window.localStorage.setItem('AdventurerPlayer', id)
    players[id] = createSprite(name, charactor, status)
    app.stage.addChild(players[id])
}

// player reconnect
function reconnectPlayer(id) {
    if (response) {// simulate network
        createPlayer(name, charactor, status)
    }
}

function bindKey(conf) {
    Object.keys(conf).forEach(k => {
        let key = keyboard(conf[k])
        if (k == 'jump') {
            key.press = () => keys[k] = true
        } else {
            key.press = () => keys[k] = true
        }
        key.release = () => keys[k] = false
    })
}


// hanlder network request response 
function updateControl() {
    // send control to server
    socket.emit('control_event', localPlayerId, keys)
    // console.log(localPlayerId + ' : ' +keys)
}