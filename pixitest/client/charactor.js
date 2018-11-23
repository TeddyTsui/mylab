let Container = PIXI.Container,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    AnimatedSprite = PIXI.extras.AnimatedSprite

export function createSprite(name, charactor, status) {
    let charactorSheet = resources[charactor].spritesheet
    let player = new Container(),
        entity = new Container()

    player.name = name
    player.abilities = resources[charactor].baseAbilities

    let selfCircle = new Graphics()
    selfCircle.lineStyle(2, 0x00FF00, 1)
    selfCircle.drawCircle(player.x + 16, player.y + 60, 10)
    selfCircle.scale.y = 0.5

    player.addChild(selfCircle)
    player.addChild(entity)
    initAnim(entity, charactorSheet)

    player.entity = entity
    player.status = selfCircle
    player.lastX = 'right'
    player.vx = 0;
    player.vy = 0;
    player.actionCounter = 0
    player.dashCounter = 0 
    player.attackCounter = 0

    return player
}

function initAnim(sprite, sheet) {
    sprite.anim = {}

    Object.keys(sheet.animations).forEach(k => {
        sprite.anim[k] = new AnimatedSprite(sheet.animations[k]);
        sprite.anim[k].animationSpeed = .2;
        sprite.anim[k].alpha = 0;
        sprite.anim[k].frameCount = sheet.animations[k].length;
        sprite.anim[k].name = k;
        sprite.addChild(sprite.anim[k]);
    })
}

export function playAnim(sprite, animName, toZero) {
    if (sprite.activeAnim) {
        sprite.activeAnim.alpha = 0;
        sprite.activeAnim.stop();
    }
    sprite.activeAnim = sprite.anim[animName];
    sprite.activeAnim.alpha = 1;
    if (toZero) sprite.activeAnim.gotoAndPlay(0);
    else sprite.activeAnim.play();
}
