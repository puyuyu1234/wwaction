//@ts-check
"use strict";

class StageScene extends Scene {
    /**
     * @param {Game} game
     * @param {number} stageNum
     */
    constructor(game, stageNum) {
        super(game);
        const stageData = STAGEDATA[stageNum];
        this.stageWidth = stageData.stage[0].length * BLOCKSIZE;
        this.stageHeight = stageData.stage.length * BLOCKSIZE;
        new RectActor("#68a", new Rectangle(0, 0, this.stageWidth, this.stageHeight)).addChildTo(
            this
        );
        const followRateX = 0.5;
        const stageWidthFixed = (this.stageWidth - 320) * followRateX + 320;
        const stageHeightFixed = this.stageHeight;
        const stageRectFixed = new Rectangle(0, 0, stageWidthFixed, stageHeightFixed);
        const stageRect = new Rectangle(0, 0, this.stageWidth, this.stageHeight);
        this.bgLayer = new LayerActor(stageRectFixed).addChildTo(this);
        this.stageLayer = new LayerActor(stageRect).addChildTo(this);
        this.EntityLayer = new LayerActor(stageRect).addChildTo(this);
        this.entityMap = new Map();
        this.player = new Player(null, null, stageData.stage).addChildTo(this);
        this.player.on("reset", () => {
            this.changeScene(new StageScene(game, 0));
        });
        this.winds = [
            new Wind(null, null, 0, stageData.stage).addChildTo(this),
            new Wind(null, null, 0, stageData.stage).addChildTo(this),
        ];
        this.windsCount = 0;
        this.renderBackGround(stageData.bg);
        this.entityMap = new Map();
        this.renderBlock(stageData.stage);
        this.winds.forEach((w) => {
            w.x = -100;
            w.y = -100;
        });
        this.player.on("makeWind", (vx) => {
            this.windsCount = (this.windsCount + 1) % this.winds.length;
            const wind = this.winds[this.windsCount];

            // 元トルネード消去
            const vanishingWind = new Wind(wind.x, wind.y, 0, stageData.stage).addChildTo(this);
            vanishingWind.vx = wind.vx;
            vanishingWind.vy = wind.vy;
            vanishingWind.playAnimation("vanish");
            const vanishingWindTimer = new TextActor("", 0, 0).addChildTo(this);
            vanishingWindTimer.update = () => {
                if (vanishingWindTimer.time >= 12) {
                    vanishingWind.destroy();
                    vanishingWindTimer.destroy();
                }
            };

            // 移動
            wind.y = this.player.rectangle.centerY;
            wind.vx = this.player.scaleX == 1 ? 2 : -2;
            wind.vy = 0;
            wind.x = this.player.rectangle.centerX - wind.width / 2;
            wind.clearWall();
            wind.stopAtWall();
            for (let i = 0; i < 6; i++) wind.update();
            wind.vx = vx;
            wind.clearWall();
            wind.backAtLRWall();
        });

        const text = new TextActor(this.player.state, 8, 8).addChildTo(this);
        text.color = "white";
        text.textAlign = "left";
        text.textBaseline = "top";
        text.font = "10px " + FONT;
        text.cameraFollowRateX = text.cameraFollowRateY = 0;
        text.update = (input) => {
            if (input.getKey("d") == 1) {
                text.debugFlag = !text.debugFlag;
            }
            if (!text.debugFlag) {
                text.text =
                    "[操作方法]\n" +
                    "←→ : 移動\n" +
                    "↓   : しゃがみ\n" +
                    "Z    : ジャンプ\n" +
                    "X    : 風\n" +
                    "R    : リトライ\n" +
                    "D    : デバッグテキスト表示/非表示\n" +
                    "\n" +
                    "[INFO]\n" +
                    `x:${this.player.x.toFixed(1)}, y:${this.player.y.toFixed(3)}\n` +
                    `state:${this.player.state}\n`;
            } else {
                text.text = "";
            }
        };

        /*
        this.hitRect2 = new RectActor("#0f04", player.hitbox);
        this.hitRect2.addChildTo(this);
        this.hitRect2.update = () => {
            const currentHitbox = new Rectangle(player.x, player.y, player.width, player.height);
            this.hitRect2.rectangle = currentHitbox;
        };

        this.hitRect = new RectActor("#f004", player.hitbox);
        this.hitRect.addChildTo(this);
        this.hitRect.update = () => {
            const currentHitbox = new Rectangle(
                player.x + player.hitbox.x,
                player.y + player.hitbox.y,
                player.hitbox.width,
                player.hitbox.height
            );
            this.hitRect.rectangle = currentHitbox;
        };
        /*
        this.hitRectw = new RectActor("#f004", wind.hitbox);
        this.hitRectw.addChildTo(this);
        this.hitRectw.update = () => {
            const currentHitbox = new Rectangle(
                wind.x + wind.hitbox.x,
                wind.y + wind.hitbox.y,
                wind.hitbox.width,
                wind.hitbox.height
            );
            this.hitRectw.rectangle = currentHitbox;
        };
        */
    }

    update(input) {
        super.update(input);

        {
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
        for (const wind of this.winds) {
            if (wind.currentHitbox.hitTest(this.player.currentHitbox)) {
                this.player.dispatch("hitWind");
            }
            this.entityMap.forEach((e) => {
                if (wind.currentHitbox.hitTest(e.currentHitbox)) {
                    e.dispatch("hitWind");
                }
            });
        }
    }

    renderBackGround(blockPattern) {
        const followRateX = 0.5;
        const stageWidthFixed = (this.stageWidth - 320) * followRateX + 320;
        const stageHeightFixed = this.stageHeight;
        const stageRectFixed = new Rectangle(0, 0, stageWidthFixed, stageHeightFixed);
        this.bgLayer.cameraFollowRateX = followRateX;
        for (let y = 0; y < stageHeightFixed; y += BLOCKSIZE) {
            for (let x = 0; x < stageWidthFixed; x += BLOCKSIZE) {
                const spriteRect = new Rectangle(x, y, BLOCKSIZE, BLOCKSIZE);
                const sprite = new SpriteActor("block", spriteRect);
                const blockPatternWidth = blockPattern[0].length;
                const blockPatternHeight = blockPattern.length;
                const blockTile = blockPattern[y % blockPatternHeight][x % blockPatternWidth];
                sprite.playAnimation("bg-" + blockTile);
                sprite.cameraFollowRateX = followRateX;
                sprite.addChildTo(this.bgLayer);
            }
        }
        new RectActor("#8888", stageRectFixed).addChildTo(this.bgLayer);
    }

    renderBlock(stage) {
        for (let h = 0; h < stage.length; h++) {
            for (let w = 0; w < stage[0].length; w++) {
                const block = stage[h][w];
                const x = w * BLOCKSIZE;
                const y = h * BLOCKSIZE;
                if (isUpperCase(block)) {
                    // エンティティ登録
                    if (block == "U") {
                        this.player.x = x;
                        this.player.y = y - BLOCKSIZE;
                        continue;
                    }
                    const sprite = new ENTITYDATA[block].cl(x, y, stage);
                    sprite.addChildTo(this.EntityLayer);
                    this.entityMap.set(sprite.entityKey, sprite);
                } else {
                    // 通常ブロック登録
                    const sprite = new SpriteActor(
                        "block",
                        new Rectangle(x, y, BLOCKSIZE, BLOCKSIZE)
                    );
                    sprite.playAnimation(block);
                    sprite.addChildTo(this.stageLayer);
                }
            }
        }
    }
}
