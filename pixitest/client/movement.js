let sprite,keys

// preFrame = { //each logic frame & each player
//     'player_id':{
//         // position
//         x: 0,
//         y: 0,
//         z: 0,

//         // speed
//         vx: 0,
//         vy: 0,
//         vz: 0,
//         ax: 0,
//         ay: 0,

//         // action
//         lastX: 'right',
//         lastY: 'down',
//         motion: 'idel',
//         jumping: false,
//         actionCounter: 0,
//         attackCounter: 0,
//         dashCounter: 0,

//         // ability
//         speedDown: 2,
//         actionCoolDown: 10,
//         attackCoolDown: 20,
//         dashCoolDown: 10,

//         //status
//         HP: 100,
//         maxHP: 100,
//         MP: 60,
//         maxMP: 60
//     }
// }

function doSimpleLogic(preLogicFrame, operations) {
    let nextLogicFrame = {}
    Object.keys(preLogicFrame).forEach(id => {
        movement(preLogicFrame[id], operations[id])
    })
    return nextLogicFrame
}

function movement(player, operation){
    sprite = player
    keys = operation
    return calculatePosition()   
}

function calculateSpeed() {
    let ax = 0;
    let ay = 0;
    let acc = 1;
    let speedDown = 0.7;
    if (keys.up) ay -= 1;
    if (keys.down) ay += 1;
    if (keys.left) ax -= 1;
    if (keys.right) ax += 1;
    let v = normalize([ax, ay]);
    sprite.vx += v[0] * acc;
    sprite.vy += v[1] * acc;
    if (keys.dash && sprite.dashCounter == 0) {
        sprite.dashCounter = sprite.abilities.dashCoolDown;
        sprite.vx *= 6;
        sprite.vy *= 6;
    }
    sprite.vx *= speedDown;
    sprite.vy *= speedDown;
}

function calculateAnimation() {
    if (sprite.attackCounter > 0) sprite.attackCounter--;
    if (sprite.dashCounter > 0) sprite.dashCounter--;
    if (sprite.actionCounter > 0) {
        sprite.actionCounter--;
        sprite.vx *= 0.6;
        sprite.vy *= 0.6;
        return;
    }
    if (!sprite.jumping) { // not jumping
        if (Math.abs(sprite.vx) < 0.1 && Math.abs(sprite.vy) < 0.1) sprite.action = 'idle'
        else{
            if (sprite.vx > 0) {
                sprite.action = 'run'
                sprite.lastX = 'right';
            } else if (sprite.vx < 0) {
                sprite.action = 'run'
                sprite.lastX = 'left'
            } else {
                sprite.action = 'run'
            }
            if (sprite.vy > 0) sprite.lastY = 'down';
            else if (sprite.vy < 0) sprite.lastY = 'up';
        }
        if (keys.attack) {
            if (sprite.attackCounter > 0) return;
            sprite.actionCounter = sprite.abilities.actionCoolDown;
            sprite.attackCounter = sprite.abilities.attackCoolDown;
            sprite.action = 'attack';
        }
        if (keys.jump) {
            sprite.jumping = true;
            sprite.entity.vy = -5;
        }

        return 0
    } else { // jumping
        if (sprite.vx > 0) sprite.lastX = 'right';
        else if (sprite.vx < 0) sprite.lastX = 'left';

        if (keys.attack) {
            if (sprite.attackCounter <= 0) {
                sprite.actionCounter = sprite.abilities.actionCoolDown;
                sprite.attackCounter = sprite.abilities.attackCoolDown;
                sprite.action = 'jump_attack'
            }
        }else sprite.action = 'jump'

        // jump down
        let az = 0.3, z
        sprite.entity.vy += az;
        z = sprite.entity.y + sprite.entity.vy;
        if (z > 0) {
            z = 0;
            sprite.jumping = false;
        }
        return z
    }
}

function calculatePosition() {
    calculateSpeed()
    let z = calculateAnimation()
    return {
        x: sprite.x + sprite.vx,
        y: sprite.y + sprite.vy,
        z: z
    }
}

function normalize(arr) {
    let arr2 = [];
    let down = 0;
    arr.forEach(a => down += a * a);
    down = Math.sqrt(down);
    if (down == 0) return arr;
    for (let i = 0; i < arr.length; i++)
        arr2[i] = arr[i] / down;
    return arr2;
}