import { keyboard } from './utils.js'
import { createSprite, playAnim } from './charactor.js'
import { doSimpleLogic } from './movement.js'

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
    bindKey(controllConfig)

    socket.on('init_client', ({ currentFrameIndex, fpsRadio, nextLogicFrame: initLogicFrame, players: playerList }) => {
        players = playerList
        fpsRadio = fpsRadio
        gameFrame = currentFrameIndex * fpsRadio
        nextGameFrame = gameFrame + fpsRadio
        logicFrameIndexArr.push(currentFrameIndex)
        logicFrameCahce[currentFrameIndex] = initLogicFrame
        console.log(initLogicFrame)
        // cache frame
        // how to init nextGameFrame
        loader.add('adventurer', 'sheet/adventurer/adventurer.json')
            .load(setup)
    })

    socket.on('create_player', initPlayer)

    socket.on('update_frame', (logicFrameIndex,controls) => {
        updateCache[logicFrameIndex] = controls
        // console.log(keys)
    })

    function setup() {
        // set up charactor ability
        resources.adventurer.baseAbilities = {
            actionCoolDown: 20,
            attackCoolDown: 40,
            dashCoolDown: 20
        }

        Object.keys(players).forEach(id => {
            initPlayer(id, players[id].name, players[id].charactor)
        })

        // cache frame
        state = cacheFrame
        
        app.ticker.add(delta => gameLoop(delta))

        //for test
        let currentPlayerId = window.localStorage.getItem('AdventurerPlayer')
        if(currentPlayerId == null || players[currentPlayerId] == undefined){
            createCurrentPlayer('TEST', 'adventurer')
        }
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

    // console.log(updateCache)

    // gameFrame count greater than nextGameFrame then do logic
    if (gameFrame > nextGameFrame) {
        if (updateCache[curFrameIndex] !== undefined) {
            nextGameFrame += fpsRadio
            if (nextGameFrame > maxFrameCache) {
                nextGameFrame -= maxFrameCache
            }
            // console.log(logicFrameCahce)
            // console.log(prevFrameIndex + ' : ' +logicFrameCahce[prevFrameIndex])
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
    // console.log(logicFrame)
    Object.keys(players).forEach(id => {
        if(logicFrame[id] !== undefined){
            let { x, y, z } = logicFrame[id]
            players[id].x += (x - players[id].x) / fpsRadio * offset
            players[id].y += (y - players[id].y) / fpsRadio * offset
            let entity = players[id].getChildByName('entity')
            entity.y += (z - entity.y) / fpsRadio * offset
    
            playAnim(entity, logicFrame[id].motion, logicFrame[id].fromZero)
            logicFrame[id].fromZero = false
        }

    })
}


// create a charactor for local player
function createCurrentPlayer(name, charactor) {
    if (name == '') {
        return
    }

    socket.emit('create_current_player', { name, charactor })

    socket.on('is_creating', (id) => {
        window.localStorage.setItem('AdventurerPlayer', id)
        socket.emit('get_ready')
    })
}

// init a charactor
function initPlayer(id, name, charactor, status, initStatus) {
    let isCurrentPlayer = false
    if(id == window.localStorage.getItem('AdventurerPlayer')){
        localPlayerId = id
        isCurrentPlayer = true
    }

    if(initStatus){
        logicFrameCahce[gameFrame/fpsRadio][id] = initStatus
    }

    players[id] = createSprite(name, charactor, status, isCurrentPlayer)
    app.stage.addChild(players[id])
}

// player reconnect
function reconnectPlayer(id) {
    
}

function bindKey(conf) {
    Object.keys(conf).forEach(k => {
        let key = keyboard(conf[k])
        key.press = () => keys[k] = true
        key.release = () => keys[k] = false
    })
}


// hanlder network request response 
function updateControl() {
    // send control to server
    if(localPlayerId != null && localPlayerId != undefined ){
        socket.emit('control_event', localPlayerId, keys)
    }
}