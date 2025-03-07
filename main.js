//@ts-check
"use strict";

images.addImage("player", "img/player.gif");
images.addSpriteData("player", 6, 3, [
    new SpriteAnimation("stand", [0, 1, 2, 1], 6, true),
    new SpriteAnimation("walk", [3, 4, 5, 4], 6, true),
    new SpriteAnimation("jumpUp", [6, 7, 8, 7], 6, true),
    new SpriteAnimation("jumpDown", [9, 10, 11, 10], 6, true),
    new SpriteAnimation("wind", [12, 13, 14, 15], 3, false),
    new SpriteAnimation("sit", [16, 17], 3, false),
    new SpriteAnimation("standUp", [16]),
]);
images.addImage("entity", "img/entity.gif");
images.addSpriteData("entity", 2, 2, [new SpriteAnimation(ENTITYDATA.A.key, [0, 1], 12, true)]);
images.addImage("wind", "img/wind.gif");
images.addSpriteData("wind", 4, 2, [
    new SpriteAnimation("wind", [0, 1, 2, 3], 3, true),
    new SpriteAnimation("vanish", [4, 5, 6, 7], 3, false),
]);
images.addImage("block", "img/tileset.gif");
const blockDataList = Object.entries(BLOCKDATA).map(
    ([key, v]) => new SpriteAnimation(key, v.frame)
);
blockDataList.push(
    ...Object.entries(BGDATA).map(([key, v]) => new SpriteAnimation("bg-" + key, v.frame))
);
images.addSpriteData("block", 10, 10, blockDataList);

let game;
images.loadAll().then(() => {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("screenCanvas"));

    game = new Game(canvas, 50);
    game.changeScene(new StageScene(game, 0));
    images.loadAll().then(() => {
        game.start();
    });
});
