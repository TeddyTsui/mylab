import { Container, loader } from './sheetLoader'

export function createSprite(name, character, status) {
    let characterSheet = loader.resources[character].spritesheet
    let adventurer = new Container()
        body = new Container()

    adventurer.name = name

    selfCircle = new PIXI.Graphics()
    selfCircle.lineStyle(2, 0x00FF00, 1)
    selfCircle.drawCircle(adventurer.x + 16, adventurer.y + 60, 10)
    selfCircle.scale.y = 0.5

    adventurer.addChild(selfCircle)
    adventurer.addChild(body)
    initAnim(body, character, characterSheet)

    return adventurer
}

function initAnim(sprite, sheet) {
    Object.keys(sheet.animations).forEach(k => {
        sprite.anim[k] = new AnimatedSprite(sheet.animations[k]);
        sprite.anim[k].animationSpeed = .2;
        sprite.anim[k].alpha = 0;
        sprite.anim[k].frameCount = sheet.animations[k].length;
        sprite.anim[k].name = k;
        sprite.addChild(sprite.anim[k]);
    })
}

function playAnim(sprite, animName, toZero) {
    if (sprite.activeAnim) {
        sprite.activeAnim.alpha = 0;
        sprite.activeAnim.stop();
    }
    sprite.activeAnim = sprite.anim[animName];
    sprite.activeAnim.alpha = 1;
    if (toZero) sprite.activeAnim.gotoAndPlay(0);
    else sprite.activeAnim.play();
}
