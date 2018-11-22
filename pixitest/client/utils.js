export function keyboard(keyCode) {
    let key = {}
    key.code = keyCode
    key.isUp = true
    key.isDown = false
    key.press = undefined
    key.release = undefined
    key.downHandler = event => {
        if(event.keyCode === keyCode){
            if (key.isUp && key.press) key.press();
            key.isDown = true
            key.isUp = false
        }
        event.preventDefault()
    }
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false
            key.isUp = true
        }
        event.preventDefault()
    }
    window.addEventListener("keydown", key.downHandler.bind(key), false)
    window.addEventListener("keyup", key.upHandler.bind(key), false)
    return key;
}
