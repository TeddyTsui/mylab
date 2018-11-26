import { keyboard } from './utils.js'
import { createSprite, playAnim } from './charactor.js'
import { doSimpleLogic } from './movement.js'


const response = true //simulation
const dataTemplate = {
    players: []
}

const playerTemplate = {
    id: 'Nijia_001',
    name: 'Nijia_001',
    charactor: 'adventurer',
    status: {
        HP: '100/100'
    }
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
    keys = {},
    state

let gameFrame,
    nextGameFrame,
    maxFrameCache = 60 * 60 * 60,
    fpsRadio = 2,
    updateCache = [],
    logicFrameCahce = []

export function initClient(element, io, url) {

    let width = element.offsetWidth,
        height = element.offsetHeight

    app = new Application({ width: width, height: height })
    element.appendChild(app.view)

    // TODO add container { playground, UIlayer}
    // TODO initUI()

    let socket = io(url)
    // if (response) {// simulate network
    //     gameFrame = 0

    //     loader.add('adventurer', 'sheet/adventurer/adventurer.json')
    //         .load(setup)
    // }

    socket.on('init_client', ({currentFrameIndex, fpsRadio, players}) => {
        players = players
        fpsRadio = fpsRadio
        gameFrame = currentFrameIndex
        // cache frame
        // how to init nextGameFrame
        loader.add('adventurer', 'sheet/adventurer/adventurer.json')
            .load(setup)
    })

    socket.on('create_player', ({id, name, charactor, status}) => {
        initPlayer({id, name, charactor, status})
    })

    socket.on('update_frame', (keys) => {
        updateCache.push(keys)
    })

    function setup() {
        // set up charactor ability
        resources.adventurer.baseAbilities = {
            actionCoolDown: 20,
            attackCoolDown: 40,
            dashCoolDown: 20
        }

        if (players.length > 0) {
            players.forEach(player => {
                initPlayer({ player })
            })
        }

        state = play
        app.ticker.add(delta => gameLoop(delta))

        // for test
        createPlayer('TEST', 'adventurer')
        // let network = setInterval(communicate, 1000 / 60 * fpsRadio)
        nextGameFrame = 0

        logicFrameCahce.push(
            {
                'Nijia_001': {
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
            })
    }
}

function gameLoop(delta) {
    state(delta)
}

let counter

function play(delta) {
    if (gameFrame > maxFrameCache) {
        gameFrame = 0
    } else {
        gameFrame += delta
    }

    let index = Math.floor(delta / fpsRadio)
    let offset = delta % fpsRadio

    //
    if (gameFrame > nextGameFrame) {
        nextGameFrame += fpsRadio * (index + 1)
        if(nextGameFrame > maxFrameCache){
            nextGameFrame -= maxFrameCache
        }

        if (updateCache.length > 0) {
            // do some Logic
            logicFrameCahce.push(
                doSimpleLogic(logicFrameCahce[logicFrameCahce.length - 1], updateCache.shift())
            )
        }
    }

    // update game frame
    if (logicFrameCahce.length > 0) {
        if (index >= 0 && index >= logicFrameCahce.length) {
            if (index >= logicFrameCahce.length) {
                counter = fpsRadio
                index = logicFrameCahce.length
                updateGameFrame(logicFrameCahce[logicFrameCahce.length-1], offset)
                return
            } else {
                counter = offset
            }
        } else {
            counter += offset
        }

        updateGameFrame(logicFrameCahce[index], offset)

        if (counter == fpsRadio) {
            logicFrameCahce.splice(0, index + 1)
        } else if (index) {
            logicFrameCahce.splice(0, index)
        }
    }
}

// calculate interpolation rendering
function updateGameFrame(logicFrame, offset) {
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

    socket.emit('create_player', {name, charactor})
    socket.on('create_success', () => {
        bindKey(conf)
    })
    // if (response) {// simulate network
    //     // TODO handle response data

    //     playerTemplate.name = name
    //     console.log(charactor)

    //     initPlayer(playerTemplate)

    //     bindKey(conf)

    //     state = play
    //     app.ticker.add(delta => gameLoop(delta))
    // }
}

// init a charactor
function initPlayer({ id, name, charactor, status }) {
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
            key.press = () => { keys[k] = true; console.log(keys) }
        } else {
            key.press = () => keys[k] = true
        }
        key.release = () => keys[k] = false
    })
}


// hanlder network request response 

function updateControl() {
    // send control to server
}

function communicate() {
    if (response) {
        updateCache.push({ 'Nijia_001': keys })
    }
}