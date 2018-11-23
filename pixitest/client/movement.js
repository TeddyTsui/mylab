let preStatus, 
    nextStatus = {},
    keys

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
//         az: .6,

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

export function doSimpleLogic(preLogicFrame, operations) {
    let nextLogicFrame = {}
    Object.keys(preLogicFrame).forEach(id => {
        movement(preLogicFrame[id], operations[id])
    })
    return nextLogicFrame
}

function movement(player, operation){
    preStatus = player
    keys = operation
    calculateSpeed()
    calculateAnimation()
    nextLogicFrame[player.id] = nextStatus
}

function calculateSpeed() {
    let acc = 1;
    if (keys.up) nextStatus.ay = preStatus.ay - 1;
    if (keys.down) nextStatus.ay = preStatus.ay + 1;
    if (keys.left) nextStatus.ax = preStatus.ax - 1;
    if (keys.right) nextStatus.ax = preStatus.ax + 1;
    let v = normalize([nextStatus.ax, nextStatus.ay]);
    nextStatus.vx = preStatus.vx + v[0] * acc;
    nextStatus.vy = preStatus.vy + v[1] * acc;
    if (keys.dash && preStatus.dashCounter == 0) {
        nextStatus.dashCounter = preStatus.dashCoolDown;
        nextStatus.vx *= 6;
        nextStatus.vy *= 6;
    }
    nextStatus.vx *= preStatus.speedDown;
    nextStatus.vy *= preStatus.speedDown;

    nextStatus.x = preStatus.x + nextStatus.vx
    nextStatus.y = preStatus.y + nextStatus.vy
}

function calculateAnimation() {
    if (preStatus.attackCounter > 0) nextStatus.attackCounter--;
    if (preStatus.dashCounter > 0) nextStatus.dashCounter--;
    if (preStatus.actionCounter > 0) {
        nextStatus.actionCounter--;
        nextStatus.vx *= 0.6;
        nextStatus.vy *= 0.6;
        return;
    }
    if (!preStatus.jumping) { // not jumping
        
        nextStatus.jumping = preStatus.jumping
        nextStatus.z = 0

        if (Math.abs(nextStatus.vx) < 0.1 && Math.abs(nextStatus.vy) < 0.1) nextStatus.action = 'idle'
        else{
            if (nextStatus.vx > 0) {
                nextStatus.action = 'run'
                nextStatus.lastX = 'right';
            } else if (nextStatus.vx < 0) {
                nextStatus.action = 'run'
                nextStatus.lastX = 'left'
            } else {
                nextStatus.action = 'run'
            }
            if (nextStatus.vy > 0) nextStatus.lastY = 'down';
            else if (nextStatus.vy < 0) nextStatus.lastY = 'up';
        }
        if (keys.attack) {
            if (preStatus.attackCounter > 0) return;
            nextStatus.actionCounter = preStatus.actionCoolDown;
            nextStatus.attackCounter = preStatus.attackCoolDown;
            nextStatus.action = 'attack';
        }
        if (keys.jump) {
            nextStatus.jumping = true;
            nextStatus.z = -5;
        }
    } else { // jumping
        if (nextStatus.vx > 0) nextStatus.lastX = 'right';
        else if (nextStatus.vx < 0) nextStatus.lastX = 'left';

        if (keys.attack) {
            if (preStatus.attackCounter <= 0) {
                nextStatus.actionCounter = preStatus.actionCoolDown;
                nextStatus.attackCounter = preStatus.attackCoolDown;
                nextStatus.action = 'jump_attack'
            }
        }else nextStatus.action = 'jump'

        // jump down
        nextStatus.z += nextStatus.az
        if (nextStatus.z > 0) {
            nextStatus.z = 0;
            nextStatus.jumping = false;
        }
    }
}

function calculatePosition() {
    calculateSpeed()
    calculateAnimation()
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