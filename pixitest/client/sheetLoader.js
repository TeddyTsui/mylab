// load all sheet
const Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    AnimatedSprite = PIXI.extras.AnimatedSprite

loader.add('adventurer', 'sheet/adventurer/adventurer.json')
    .load(setup)


function setup() {
    // setup charaters data
}