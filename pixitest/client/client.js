import { keyboard } from './utils.js'
import { createSprite } from './charactor.js'

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
    keys = {}

let gameFrame,
    nextGameFrame,
    maxFrameCache = 60*60*60

function initClient(element) {

    let width = element.offsetWidth,
        height = element.offsetHeight

    app = new Application({ width: width, height: height })
    element.appendChild(app.view)

    // TODO add container { playground, UIlayer}
    // TODO initUI()

    if (response) {// simulate network
        gameFrame = 0

        if (dataTemplate.players.length > 0) {
            dataTemplate.players.forEach(player => {
                initPlayer({ player })
            })
        }
    }

    // for test
    createPlayer('TEST', 'adventurer')
}

// create a charactor for local player
function createPlayer(name, charactor, conf = controllConfig) {
    if (name == '') {
        return
    }
    if (response) {// simulate network
        // TODO handle response data

        playerTemplate.name = name
        console.log(charactor)

        initPlayer({ playerTemplate })

        bindKey(conf)

        state = play
        app.ticker.add(delta => gameLoop(delta))
    }
}

// init a charactor
function initPlayer({ id, name, charactor, status }) {
    window.localStorage.setItem('AdventurerPlayer', id)
    let newAdventurer = createSprite(name, charactor, status, conf)
    players[id] = newAdventurer
    self = newAdventurer
    app.stage.addChild(adventurer)
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
        key.press = () => keys[k] = true
        key.release = () => keys[k] = false
    })
}


function gameLoop(delta) {
    state(delta)
}

let counter

function play(delta) {
    if(gameFrame > maxFrameCache){
        gameFrame = 0    
    }else{
        gameFrame += delta
    }

    let index = Math.floor(delta/ fpsRadio)
    let offset = delta% fpsRadio

    if(gameFrame > nextGameFrame){
        nextGameFrame += fpsRadio* (index + 1)
        
        // do some Logic
    }

    if(updateCache.length > 0){
        

        if(index > 0 && index > updateCache.length){
            if(index > updateCache.length){
                counter = fpsRadio
                index = updateCache.length
            }else{
                couter = offset
            }
        }else{
            couter += offset
        }

        updateFrame(updateCache[index], offset)

        if(counter == fpsRadio){
            updateCache.splice(0, index + 1)
        }else if(index){
            updateCache.splice(0, index)
        }
    }
}

function updateControl() {
    // send control to server
}

function updateFrame(logicFrame, offset){
    players.map(function(player){
        let {x, y, z} = movement(player, logicFrame[player.id])
        player.x = (x - player.x)/ fpsRadio* offset
        player.y = (y - player.y)/ fpsRadio* offset
        player.entity.y = (z - play.entity.y)/ fpsRadio* offset
    })
}

function communicate(){
    if(response){
        updateCache.push({'Nijia_001': keys})
    }
}

initClient(document.getElementById('playground'))