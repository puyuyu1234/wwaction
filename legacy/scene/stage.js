//@ts-check
"use strict";

class StageScene extends Scene {
  /**
   * @param {Game} game
   * @param {number} stageNum
   */
  constructor(game, stageNum, retry = false) {
    super(game);
    const stageData = STAGEDATA[stageNum];
    this.stageWidth =
      stageData.stages.reduce((s1, s2) =>
        s1[0].length > s2[0].length ? s1 : s2
      )[0].length * BLOCKSIZE;
    this.stageHeight =
      stageData.stages.reduce((s1, s2) => (s1.length > s2.length ? s1 : s2))
        .length * BLOCKSIZE;
    const stageRect = new Rectangle(0, 0, this.stageWidth, this.stageHeight);
    /** @type {Map<string, Entity>} */
    this.entityMap = new Map();

    new RectActor("#68a", stageRect).addChildTo(this);
    this.renderBackGround(stageData.bg);
    this.stageLayer = new LayerActor(stageRect).addChildTo(this);

    // チュートリアル特殊処理
    if (stageNum == 0) {
      new UISprite("a", 16, 96).addChildTo(this);
      new UISprite("d", 64, 96).addChildTo(this);
      new UISprite("w", 224, 112).addChildTo(this);
      new UISprite(" ", 432, 112).addChildTo(this);
      new UISprite(" ", 64 + 656, 80).addChildTo(this);
      new UISprite("+", 64 + 672, 96).addChildTo(this);
      new UISprite(" ", 64 + 656, 112).addChildTo(this);
      new UISprite("s", 64 + 848, 80).addChildTo(this);
      new UISprite("+", 64 + 848, 96).addChildTo(this);
      new UISprite(" ", 64 + 832, 112).addChildTo(this);
    }
    this.EntityLayer = new LayerActor(stageRect).addChildTo(this);

    const maxHp = HPDATA[option.difficulty];
    const hp = option.currentHP ?? maxHp;
    const hpBar = new HPBar(hp, maxHp).addChildTo(this);
    this.player = new Player(
      null,
      null,
      stageData.stages,
      hp,
      maxHp,
      hpBar
    ).addChildTo(this);
    this.topLayer = new LayerActor(stageRect).addChildTo(this);
    this.renderBlock(stageData.stages, stageData.param);
    this.player.on("death", () => {
      const cameraMove = new NullActor().addChildTo(this);
      const cameraX = this.camera.rectangle.x;
      const cameraY = this.camera.rectangle.y;
      cameraMove.update = () => {
        if (cameraMove.time < 10) {
          const ranMove = () => Math.random() * 10 - 5;
          this.camera.rectangle.x = cameraX + ranMove();
          this.camera.rectangle.y = cameraY + ranMove();
        } else {
          this.camera.rectangle.x = cameraX;
          this.camera.rectangle.y = cameraY;
          cameraMove.destroy();
        }
      };

      // オートリトライ
      const retryTimer = new NullActor().addChildTo(this);
      retryTimer.update = () => {
        if (retryTimer.time == 30) {
          this.player.dispatch("reset");
        }
      };
    });
    this.player.on("reset", () => {
      option.currentHP = null;
      this.dispatch("transScene", new StageScene(game, stageNum, true));
    });
    this.player.on("makeWind", (vx) => this.makeWind(vx));
    this.winds = [
      new Wind(-100, -100, 0, stageData.stages).addChildTo(this),
      new Wind(-100, -100, 0, stageData.stages).addChildTo(this),
    ];
    this.windsCount = 0;

    const goal = new GoalEntity(
      new Rectangle(this.stageWidth - 1, 0, 3, this.stageHeight)
    ).addChildTo(this);
    this.entityMap.set(goal.entityKey, goal);
    this.player.on("nextStage", () => {
      option.currentHP = this.player.hp;
      this.dispatch("transScene", new StageScene(game, stageNum + 1));
    });

    if (!retry && stageData.name) {
      const moveTime = 40;
      const waitTime = 120;
      const r1 = new RectActor(
        "#0008",
        new Rectangle(320, 90, 320, 30)
      ).addChildTo(this);
      const r2 = new RectActor(
        "#0008",
        new Rectangle(-320, 60, 320, 30)
      ).addChildTo(this);
      r1.cameraFollowRateX = r1.cameraFollowRateY = 0;
      r2.cameraFollowRateX = r2.cameraFollowRateY = 0;
      r1.update = () => {
        if (r1.time <= moveTime) {
          r1.x = easeOutExpo(320, 0, r1.time, moveTime);
          r2.x = easeOutExpo(-320, 0, r1.time, moveTime);
        } else if (r1.time <= waitTime + moveTime) {
        } else if (r1.time <= waitTime + moveTime * 2) {
          const t = r1.time - (waitTime + moveTime);
          r1.x = easeOutExpo(0, -320, t, moveTime);
          r2.x = easeOutExpo(0, 320, t, moveTime);
          r1.alpha = easeOutExpo(1, 0, t, moveTime);
          r2.alpha = easeOutExpo(1, 0, t, moveTime);
        } else {
          r1.destroy();
          r2.destroy();
        }
      };

      const makeStageNameText = (name, y, fontSize, letterSize) => {
        this.defaultData.font = fontSize + "px " + FONT;
        this.defaultData.color = "white";
        for (let i = 0; i < name.length; i++) {
          const x = ((i - name.length / 2) * fontSize * letterSize) / 2 + 160;
          const y1 = y - 30;
          const delayTime = i * 2;
          const letter = new TextActor(name[i], x, y).addChildTo(this);
          letter.alpha = 0;
          letter.cameraFollowRateX = letter.cameraFollowRateY = 0;
          letter.update = () => {
            if (
              delayTime <= letter.time &&
              letter.time <= delayTime + moveTime
            ) {
              letter.y = easeOutExpo(y, y1, letter.time - delayTime, moveTime);
              letter.alpha = easeLinear(
                0,
                1,
                letter.time - delayTime,
                moveTime
              );
            } else if (letter.time <= delayTime + moveTime + waitTime) {
            } else if (letter.time <= delayTime + moveTime + 2 * waitTime) {
              const t = letter.time - (delayTime + waitTime + moveTime);
              letter.y = easeOutExpo(y1, y1 - 15, t, moveTime);
              letter.alpha = easeOutExpo(1, 0, t, moveTime);
            } else {
              letter.destroy();
            }
          };
        }
      };
      makeStageNameText(stageData.name, 110, 16, 2);
      makeStageNameText(stageData.engName, 135, 12, 1);
    }

    // 画面遷移演出・開閉
    {
      const size = 400;
      const x = 160 - size / 2;
      const y = 120 - size / 2;
      const startDx = 200;
      const dx = 390;
      const moveTime = 10;
      const rect1 = new Rectangle(x + startDx, y, size, size);
      const rect2 = new Rectangle(x - startDx, y, size, size);
      const black1 = new RectActor("#000", rect1).addChildTo(this);
      const black2 = new RectActor("#000", rect2).addChildTo(this);
      black1.cameraFollowRateX = black1.cameraFollowRateY = 0;
      black2.cameraFollowRateX = black2.cameraFollowRateY = 0;
      black1.rotate = black2.rotate = -10;
      black1.update = () => {
        black1.x = easeInSine(x + startDx, x + dx, black1.time, moveTime);
        black2.x = easeInSine(x - startDx, x - dx, black1.time, moveTime);
        if (black1.time >= moveTime) {
          black1.destroy();
          black2.destroy();
          if (!retry) {
            if (stageData.param.bgm) {
              sounds.play(stageData.param.bgm);
            }
          }
        }
      };

      this.on("transScene", (nextScene) => {
        this.player.isFreezed = true;
        const rect1 = new Rectangle(x + dx, y, size, size);
        const rect2 = new Rectangle(x - dx, y, size, size);
        const black1 = new RectActor("#000", rect1).addChildTo(this);
        const black2 = new RectActor("#000", rect2).addChildTo(this);
        black1.rotate = black2.rotate = -10;
        black1.cameraFollowRateX = black1.cameraFollowRateY = 0;
        black2.cameraFollowRateX = black2.cameraFollowRateY = 0;
        const delayTime = 10;
        black1.update = () => {
          black1.x = easeOutSine(x + dx, x + startDx, black1.time, moveTime);
          black2.x = easeOutSine(x - dx, x - startDx, black1.time, moveTime);
          if (black1.time >= moveTime + delayTime) {
            this.changeScene(nextScene);
          }
        };
      });
    }

    if (DEBUG) {
      const text = new TextActor(
        this.player.state.currentState,
        8,
        8
      ).addChildTo(this);
      text.color = "white";
      text.textAlign = "left";
      text.textBaseline = "top";
      text.font = "10px " + FONT;
      text.cameraFollowRateX = text.cameraFollowRateY = 0;
      text.alpha = 0;
      text.update = (input) => {
        if (input.getKey("1") == 1) {
          text.alpha = !text.alpha;
        }
        text.text =
          "[操作方法]\n" +
          "A/D  : 移動\n" +
          "S    : しゃがみ\n" +
          "W    : ジャンプ\n" +
          "Space: 風\n" +
          "R    : リトライ\n" +
          "1    : デバッグテキスト表示/非表示\n" +
          "\n" +
          "[INFO]\n" +
          `x:${this.player.x.toFixed(1)}, y:${this.player.y.toFixed(3)}\n` +
          `state:${this.player.state.currentState}\n` +
          `stateTime:${this.player.state.time}\n` +
          `noHitTime:${this.player.noHitboxTime}\n` +
          "\n" +
          (this.boss ? `bossStatus:${this.boss.state}\n` : "[no boss]\n") +
          "\n" +
          "\n" +
          "\n\n\n\n" +
          "[MEMO]\n" +
          "最初の地形は平原にする、風出しても反射しないように\n" +
          "風で壁を登るやつ、もうちょっと誘導いれたほうがいいかも\n";
      };
    }

    const soundTimers = {
      wind: new NullActor().addChildTo(this),
    };
    this.soundTimers = soundTimers;
  }

  update(input) {
    super.update(input);

    if (!this.player.isDead) {
      const width = this.camera.rectangle.width;
      const height = this.camera.rectangle.height;
      this.camera.rectangle.x = clamp(
        (this.player.rectangle.centerX - width / 2) | 0,
        0,
        this.stageWidth - width
      );
      this.camera.rectangle.y = clamp(
        (this.player.rectangle.centerY - height / 2) | 0,
        0,
        this.stageHeight - height
      );
    }

    // トルネード判定
    if (!this.player.isDead && !this.player.isFreezed) {
      for (const wind of this.winds) {
        if (wind.currentHitbox.hitTest(this.player.currentHitbox)) {
          this.player.dispatch("hitWind", wind);
        }
        this.entityMap.forEach((e) => {
          if (wind.currentHitbox.hitTest(e.currentHitbox)) {
            e.dispatch("hitWind", wind);
          }
        });
      }

      // 敵-player当たり判定
      for (const [key, entity] of this.entityMap) {
        if (!entity.hasTag("hit")) continue;
        if (entity.currentHitbox.hitTest(this.player.currentHitbox)) {
          entity.collision(this.player);
        }
      }
    }
  }

  makeWind(vx) {
    sounds.play("wind");
    this.windsCount = (this.windsCount + 1) % this.winds.length;
    const wind = this.winds[this.windsCount];

    // 元トルネード消去
    const vanishingWind = new Wind(wind.x, wind.y, 0, wind.stages).addChildTo(
      this
    );
    vanishingWind.vx = wind.vx;
    vanishingWind.vy = wind.vy;
    vanishingWind.playAnimation("vanish");
    const vanishingWindTimer = new NullActor().addChildTo(this);
    vanishingWindTimer.update = () => {
      if (vanishingWindTimer.time >= 12) {
        vanishingWind.destroy();
        vanishingWindTimer.destroy();
      }
    };

    // 移動
    wind.x = this.player.rectangle.centerX - wind.width / 2;
    wind.y = this.player.rectangle.centerY;
    wind.vx = this.player.scaleX == 1 ? 2 : -2;
    wind.vy = 0;
    wind.clearWall();
    wind.stopAtWall();
    for (let i = 0; i < 6; i++) wind.update();
    wind.vx = vx;
    wind.clearWall();
    wind.backAtLRWall();
  }

  renderBackGround(blockPattern) {
    const followRateX = 0.5;
    const stageWidthFixed = (this.stageWidth - 320) * followRateX + 320;
    const stageHeightFixed = this.stageHeight;
    const stageRectFixed = new Rectangle(
      0,
      0,
      stageWidthFixed,
      stageHeightFixed
    );
    const bgLayer = new LayerActor(stageRectFixed).addChildTo(this);
    bgLayer.cameraFollowRateX = followRateX;
    for (let y = 0; y < stageHeightFixed; y += BLOCKSIZE) {
      for (let x = 0; x < stageWidthFixed; x += BLOCKSIZE) {
        const spriteRect = new Rectangle(x, y, BLOCKSIZE, BLOCKSIZE);
        const sprite = new SpriteActor("block", spriteRect);
        const blockPatternWidth = blockPattern[0].length;
        const blockPatternHeight = blockPattern.length;
        const blockTile =
          blockPattern[y % blockPatternHeight][x % blockPatternWidth];
        sprite.playAnimation(blockTile);
        sprite.cameraFollowRateX = followRateX;
        sprite.addChildTo(bgLayer);
      }
    }
    new RectActor("#8888", stageRectFixed).addChildTo(bgLayer);
  }

  renderBlock(stages, stageParam) {
    // エンティティ登録
    const SetSprite = (sprite) => {
      sprite.addChildTo(this.EntityLayer);
      sprite.on("spawn", (en) => this.entityMap.set(en.entityKey, en));
      sprite.on("destroy", () => this.entityMap.delete(sprite.entityKey));
      this.entityMap.set(sprite.entityKey, sprite);
      sprite.dispatch("add", this);
    };

    for (const stage of stages) {
      for (let h = 0; h < stage.length; h++) {
        for (let w = 0; w < stage[0].length; w++) {
          const block = stage[h][w];
          const x = w * BLOCKSIZE;
          const y = h * BLOCKSIZE;
          if (!isBlock(block)) {
            // 特殊エンティティ処理
            if (block == "0") {
              this.player.x = x;
              this.player.y = y - BLOCKSIZE;
              continue;
            }
            // ボス
            if (block == "*") {
              const sprite = new stageParam.boss(x, y, stages);
              SetSprite(sprite);
              this.boss = sprite;
              continue;
            }
            const sprite = new ENTITYDATA[block].cl(x, y, stages);
            SetSprite(sprite);
          } else {
            // 通常ブロック登録
            const sprite = new SpriteActor(
              "block",
              new Rectangle(x, y, BLOCKSIZE, BLOCKSIZE)
            );
            sprite.playAnimation(block);
            const blockData = BLOCKDATA[block];
            if (blockData.param.alpha) {
              sprite.alpha = blockData.param.alpha;
            }
            if (blockData.param.layer == "top") {
              sprite.addChildTo(this.topLayer);
            } else {
              sprite.addChildTo(this.stageLayer);
            }
          }
        }
      }
    }
  }
}
