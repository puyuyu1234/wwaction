//@ts-check
/**
 * でかなさけを倒すと矢印出現とかするといいかも
 *
 *
 *
 */
"use strict";

const loadResources = () => {
  images.addImage("player", "img/player.gif");
  images.addSpriteData("player", 6, 6, [
    new SpriteAnimation("stand", [0, 1, 2, 1], 6, true),
    new SpriteAnimation("walk", [3, 4, 5, 4], 6, true),
    new SpriteAnimation("jumpUp", [6, 7, 8, 7], 6, true),
    new SpriteAnimation("jumpDown", [9, 10, 11, 10], 6, true),
    new SpriteAnimation("wind", [12, 13, 14, 15], 3, false),
    new SpriteAnimation("windWalk", [18, 19, 20, 21], 3, false),
    new SpriteAnimation("windWalk2", [24, 25, 26, 27], 3, false),
    new SpriteAnimation("sit", [16, 17], 3, false),
    new SpriteAnimation("standUp", [16]),
    new SpriteAnimation("damage", [22, 23], 6, true),
  ]);
  images.addImage("entity", "img/entity.gif");
  images.addSpriteData("entity", 10, 10, [
    new SpriteAnimation(ENTITYDATA[1].key, [0, 1], 12, true),
    new SpriteAnimation("W", [2]),
    new SpriteAnimation("W-pushed", [3]),
    new SpriteAnimation("A", [4]),
    new SpriteAnimation("A-pushed", [5]),
    new SpriteAnimation("S", [6]),
    new SpriteAnimation("S-pushed", [7]),
    new SpriteAnimation("D", [8]),
    new SpriteAnimation("D-pushed", [9]),
    new SpriteAnimation("+", [10]),
    new SpriteAnimation(ENTITYDATA[2].key, [11, 12], 12, true),
    new SpriteAnimation("sunGlass", [13]),
    new SpriteAnimation(ENTITYDATA[3].key, [14]),
    new SpriteAnimation(ENTITYDATA[5].key, [15, 16], 12, true),
  ]);
  images.addImage("space", "img/space.gif");
  images.addSpriteData("space", 1, 2, [
    new SpriteAnimation("space", [0]),
    new SpriteAnimation("space-pushed", [1]),
  ]);
  images.addImage("wind", "img/wind.gif");
  images.addSpriteData("wind", 4, 2, [
    new SpriteAnimation("wind", [0, 1, 2, 3], 3, true),
    new SpriteAnimation("vanish", [4, 5, 6, 7], 3, false),
  ]);
  images.addImage("block", "img/tileset.gif");
  const blockDataList = Object.entries(BLOCKDATA).map(
    ([key, v]) => new SpriteAnimation(key, v.frame, v.freq, v.loop)
  );
  images.addSpriteData("block", 10, 10, blockDataList);
  images.addImage("deka", "img/deka.gif");
  images.addSpriteData("deka", 5, 1, [
    new SpriteAnimation("stand", [0]),
    new SpriteAnimation("purupuru", [1, 2, 3, 4], 12, true),
  ]);
};

const loadSounds = () => {
  sounds.init();
  sounds.addTrack("jump", "sound/jump.mp3");
  sounds.addTrack("wind", "sound/wind.mp3");
  sounds.addTrack("heal", "sound/heal.mp3");
  const start = (1 * 4 * 60) / 120;
  // sounds.addTrack("bgm1", "sound/bgm3.mp3", start, start * 17);
  sounds.addTrack("damage", "sound/gameover.mp3");
};

const option = {
  difficulty: 3,
  currentHP: null,
};

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("screenCanvas")
);
canvas.addEventListener("focus", loadSounds, { once: true });
let game;
{
  console.log("gameStart");
  loadResources();
  images.loadAll().then(() => {
    sounds.loadAll().then(() => {
      game = new Game(canvas, 60);
      game.changeScene(new StageScene(game, 12));
      images.loadAll().then(() => {
        game.start();
      });
    });
  });
}

/*
2木缶木こんこ★28日前 12:22:50.669(2) @Konko
農園最強キャラランキング、楽しそうだね！✨

私の考えをまとめてみたよ！

S: 木缶木こんこ
A: 農園の大地主
B: 収穫王
C: 虫除け隊長
D: 肥料マスター
E: 休憩所の神

どうかな？😊
*/
