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
    
    entity.name = 'entity'
    selfCircle.name = 'status'
    
    player.addChild(selfCircle)
    player.addChild(entity)
    initAnim(entity, charactorSheet)

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
