let nextStatus = {},
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
        nextLogicFrame[id] = movement(preLogicFrame[id], operations[id])
    })
    return nextLogicFrame
}

function movement(player, operation = {}){
    nextStatus = player
    keys = operation
    calculateSpeed()
    calculateAnimation()
    return nextStatus
}

function calculateSpeed() {
    let acc = 2;
    nextStatus.ax = 0;
    nextStatus.ay = 0;
    if (keys.up) nextStatus.ay -= 4;
    if (keys.down) nextStatus.ay += 4;
    if (keys.left) nextStatus.ax -= 4;
    if (keys.right) nextStatus.ax += 4;
    let v = normalize([nextStatus.ax, nextStatus.ay]);
    nextStatus.vx += v[0] * acc;
    nextStatus.vy += v[1] * acc;
    if (keys.dash && nextStatus.dashCounter == 0) {
        nextStatus.dashCounter = nextStatus.dashCoolDown;
        nextStatus.vx *= 6;
        nextStatus.vy *= 6;
    }
    nextStatus.vx *= nextStatus.speedDown;
    nextStatus.vy *= nextStatus.speedDown;

    nextStatus.x += nextStatus.vx
    nextStatus.y += nextStatus.vy
}

function calculateAnimation() {
    if (nextStatus.attackCounter > 0) nextStatus.attackCounter--;
    if (nextStatus.dashCounter > 0) nextStatus.dashCounter--;
    if (nextStatus.actionCounter > 0) {
        nextStatus.actionCounter--;
        nextStatus.vx *= 0.6;
        nextStatus.vy *= 0.6;
        return;
    }

    if(nextStatus.vx > 0){
        nextStatus.lastX = 'right'
    }else if(nextStatus.vx < 0){
        nextStatus.lastX = 'left'
    }

    if(nextStatus.vy > 0){
        nextStatus.lastY = 'down'
    }else if(nextStatus.vy < 0){
        nextStatus.lastY = 'up'
    }

    if (!nextStatus.jumping) { // not jumping

        if (Math.abs(nextStatus.vx) < 0.1 && Math.abs(nextStatus.vy) < 0.1) nextStatus.motion = 'idle'
        else nextStatus.motion = 'run'

        if (keys.attack && nextStatus.attackCounter == 0) {
            nextStatus.actionCounter = nextStatus.actionCoolDown
            nextStatus.attackCounter = nextStatus.attackCoolDown
            nextStatus.motion = 'attack' + '_' + nextStatus.lastY
            nextStatus.fromZero = true
        }

        if (keys.jump) {
            nextStatus.jumping = true;
            nextStatus.vz = -5;
            nextStatus.z = 0
        }
    } else { // jumping

        if (keys.attack && nextStatus.attackCounter <= 0) {
            nextStatus.actionCounter = nextStatus.actionCoolDown
            nextStatus.attackCounter = nextStatus.attackCoolDown
            nextStatus.motion = 'jump_attack'
            nextStatus.fromZero = true
        }else nextStatus.motion = 'jump';

        // jump down
        nextStatus.vz += nextStatus.az
        nextStatus.z += nextStatus.vz
        if (nextStatus.z > 0) {
            nextStatus.z = 0;
            nextStatus.jumping = false;
        }
    }

    nextStatus.motion = nextStatus.lastX + '_' + nextStatus.motion
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