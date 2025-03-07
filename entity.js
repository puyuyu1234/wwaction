//@ts-check
"use strict";

class EntityBehavior {
    constructor(that) {
        this.gravity = () => {
            const gravity = 0.125;
            that.vy += gravity;
        };
        this.goLeftWallStop = () => {
            const wallPosition = that.currentHitbox.left - 1 + that.vx;
            that.x = ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE - that.hitbox.left;
            that.vx = 0;
        };
        this.goRightWallStop = () => {
            const wallPosition = that.currentHitbox.right + 1 + that.vx;
            that.x = ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.hitbox.right - 1;
            that.vx = 0;
        };
        this.goUpWallStop = () => {
            const wallPosition = that.currentHitbox.top + that.vy - 1;
            that.y =
                ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE - that.height + that.hitbox.height;
            that.vy = 0;
        };
        this.goDownWallStop = () => {
            const wallPosition = that.currentHitbox.bottom + that.vy + 1;
            that.y = ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.height;
            that.vy = 0;
        };
        this.goLeftWallBack = () => {
            const wallPosition = that.currentHitbox.left - 1 + that.vx;
            that.x = ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE - that.hitbox.left;
            that.vx *= -1;
        };
        this.goRightWallBack = () => {
            const wallPosition = that.currentHitbox.right + 1 + that.vx;
            that.x = ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.hitbox.right - 1;
            that.vx *= -1;
        };
        this.WindJump = () => {
            that.vy = -3;
        };
    }
}

class Entity extends SpriteActor {
    constructor(imageKey, rectangle, hitbox, stage) {
        super(imageKey, rectangle);
        this.hitbox = hitbox;
        this.stage = stage;
        this.vx = 0;
        this.vy = 0;
        this.entityKey = null;
        this.behavior = new EntityBehavior(this);
    }

    clearWall() {
        this.clearEvents("goLeftWall");
        this.clearEvents("goRightWall");
        this.clearEvents("goUpWall");
        this.clearEvents("goDownWall");
    }

    stopAtWall() {
        this.on("goLeftWall", this.behavior.goLeftWallStop);
        this.on("goRightWall", this.behavior.goRightWallStop);
        this.on("goUpWall", this.behavior.goUpWallStop);
        this.on("goDownWall", this.behavior.goDownWallStop);
    }

    backAtLRWall() {
        this.on("goLeftWall", this.behavior.goLeftWallBack);
        this.on("goRightWall", this.behavior.goRightWallBack);
        this.on("goUpWall", this.behavior.goUpWallStop);
        this.on("goDownWall", this.behavior.goDownWallStop);
    }

    update() {
        // 重力
        this.dispatch("gravity");

        // 壁判定
        const isWall = (x, y) => {
            let bx = Math.floor(x / BLOCKSIZE),
                by = Math.floor(y / BLOCKSIZE);

            if (y < 0) return 0;
            if (this.stage[by] == undefined) return 0;
            if (this.stage[by][bx] == undefined) return 15;
            let res = BLOCKDATA[this.stage[by][bx]].type;
            return res;
        };

        // 左・当たり判定が縦長の場合を考慮
        if (
            makeRangeWithEnd(this.currentHitbox.top, this.currentHitbox.bottom, BLOCKSIZE).some(
                (y) => isWall(this.currentHitbox.left - 1 + this.vx, y)
            )
        ) {
            if (this.vx < 0) {
                this.dispatch("goLeftWall");
            }
        }
        // 右
        if (
            makeRangeWithEnd(this.currentHitbox.top, this.currentHitbox.bottom, BLOCKSIZE).some(
                (y) => isWall(this.currentHitbox.right + 1 + this.vx, y)
            )
        ) {
            if (this.vx > 0) {
                this.dispatch("goRightWall");
            }
        }

        // 天井
        if (
            makeRangeWithEnd(
                this.currentHitbox.left + this.vx,
                this.currentHitbox.right + this.vx,
                BLOCKSIZE
            ).some((x) => isWall(x, this.currentHitbox.top + this.vy - 1))
        ) {
            if (this.vy < 0) {
                this.dispatch("goUpWall");
            }
        }

        // 接地
        if (
            makeRangeWithEnd(
                this.currentHitbox.left + this.vx,
                this.currentHitbox.right + this.vx,
                BLOCKSIZE
            ).some((x) => isWall(x, this.currentHitbox.bottom + this.vy + 1))
        ) {
            if (this.vy > 0) {
                this.dispatch("goDownWall");
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    get currentHitbox() {
        return new Rectangle(
            this.x + this.hitbox.x,
            this.y + this.hitbox.y,
            this.hitbox.width,
            this.hitbox.height
        );
    }
}

class Player extends Entity {
    constructor(x, y, stage) {
        const rect = new Rectangle(x, y, 24, 32);
        const hitbox = new Rectangle(7, 7, 10, 25);
        super("player", rect, hitbox, stage);
        this.vx = 0;
        this.vy = 0;
        this.sx = x;
        this.sy = y;
        this.jump = 1;
        this.animation = "stand";
        this.animationTimer = 0;
        this.coyoteTime = 6;
        this.state = "stand";
        this.on("gravity", this.behavior.gravity);
        this.on("goDownWall", () => {
            this.coyoteTime = 6;
            this.jump = 1;
        });
        this.on("hitWind", this.behavior.WindJump);
        this.stopAtWall();
        this.playAnimation(this.animation);
    }

    /** @param {Input} input  */
    processInput(input) {
        const move = () => {
            const speedX = 1.5;
            if (input.getKey("ArrowRight") > 0) this.vx = speedX;
            else if (input.getKey("ArrowLeft") > 0) this.vx = -speedX;
            else this.vx = 0;
        };
        const sit = () => {
            if (input.getKey("ArrowDown") > 0) {
                this.state = "sit";
                this.vx = 0;
                this.hitbox = new Rectangle(7, 16, 10, 16);
            }
        };
        const jump = () => {
            if (input.getKey("z") == 1) {
                if (this.jump == 1) {
                    this.jump = 0;
                    this.vy = -3;
                }
            }
        };
        const wind = (vx) => {
            if (input.getKey("x") == 1) {
                this.dispatch("makeWind", vx);
                this.animation = "wind";
                this.animationTimer = 6;
                this.playAnimation("wind");
            }
        };
        const standUp = () => {
            if (input.getKey("ArrowDown") <= 0) {
                this.state = "standUp";
                this.hitbox = new Rectangle(7, 7, 10, 25);
            }
        };
        if (input.getKey("r") == 1) {
            this.dispatch("reset");
        }
        switch (this.state) {
            // 立ち中
            case "stand":
                if (this.jump == 0) {
                    this.state = "jump";
                }
                move();
                sit();
                jump();
                wind(this.scaleX == 1 ? 2 : -2);
                break;

            // ジャンプ中
            case "jump":
                if (this.jump == 1) {
                    this.state = "stand";
                }
                move();
                jump();
                wind(this.scaleX == 1 ? 2 : -2);
                break;

            // しゃがみ中
            case "sit":
                standUp();
                wind(0);
                break;

            // しゃがみ復帰中
            case "standUp":
                if (this.animationTimer == 0) this.state = "stand";
                break;
        }
    }

    update(input) {
        this.processInput(input);

        super.update();
        if (this.coyoteTime-- < 0) this.jump = 0;
        this.updateAnimation();
    }

    updateAnimation() {
        let nextAnimation = "";
        if (this.animationTimer > 0) {
            this.animationTimer--;
            return;
        }
        switch (this.state) {
            case "stand":
            case "jump":
                if (this.vx > 0) {
                    this.scaleX = 1;
                } else if (this.vx < 0) {
                    this.scaleX = -1;
                }
                if (this.vy < 0) {
                    nextAnimation = "jumpUp";
                } else if (this.vy > 0) {
                    nextAnimation = "jumpDown";
                } else {
                    if (this.vx == 0) {
                        nextAnimation = "stand";
                    } else {
                        nextAnimation = "walk";
                    }
                }
                break;
            case "sit":
                nextAnimation = "sit";
                break;
            case "standUp":
                nextAnimation = "standUp";
                this.animationTimer = 3;
                break;
        }

        if (this.animation != nextAnimation) {
            this.animation = nextAnimation;
            this.playAnimation(nextAnimation);
        }
    }
}

class Wind extends Entity {
    constructor(x, y, vx, stage) {
        const rect = new Rectangle(x, y, 16, 16);
        const hitbox = new Rectangle(2, 1, 12, 15);
        super("wind", rect, hitbox, stage);
        this.vx = vx;
        this.on("gravity", this.behavior.gravity);
        this.backAtLRWall();

        this.playAnimation("wind");
    }
}

class Nasake extends Entity {
    constructor(x, y, stage) {
        const rect = new Rectangle(x, y, 16, 16);
        const hitbox = new Rectangle(4, 4, 8, 12);
        super("entity", rect, hitbox, stage);
        this.vx = -1 / 4;
        this.on("gravity", this.behavior.gravity);
        this.backAtLRWall();
        this.on("goLeftWall", () => (this.scaleX *= -1));
        this.on("goRightWall", () => (this.scaleX *= -1));
        this.on("hitWind", this.behavior.WindJump);

        this.playAnimation("nasake");
    }
}

/** @type {Object<string, EntityData>} */
const ENTITYDATA = {
    A: new EntityData("nasake", Nasake),
    B: new EntityData("wind", Wind),
    U: new EntityData("", null),
};

Object.entries(ENTITYDATA).forEach(([key, entityData]) => {
    BLOCKDATA[key] = new BlockData([], 0);
});
