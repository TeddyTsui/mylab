let sprite,keys

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
    if (keys.dash && dashCounter == 0) {
        dashCounter = dashCoolDown;
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
            sprite.actionCounter = sprite.charactor.actionCoolDown;
            sprite.attackCounter = sprite.charactor.attackCoolDown;
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
                sprite.actionCounter = sprite.charactor.actionCoolDown;
                sprite.attackCounter = sprite.charactor.attackCoolDown;
                sprite.action = 'jump_attack'
            }
        }else sprite.action = 'jump'

        // jump down
        let az = 0.3, z
        sprite.entity.vy += az;
        z = sprite.entity.y + sprite.entity.vy;
        if (sprite.entity.y > 0) {
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