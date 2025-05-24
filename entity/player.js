//@ts-check
"use strict";

class PlayerState {
    /**
     * @typedef {string} STATE
     */
    /** @type {STATE} */ STAND = "stand";
    /** @type {STATE} */ WALK = "walk";
    /** @type {STATE} */ JUMP = "jump";
    /** @type {STATE} */ SIT = "sit";
    /** @type {STATE} */ STAND_UP = "standUp";
    /** @type {STATE} */ DAMAGE = "damage";
    /** @type {STATE} */ INWATER = "inwater";
    /** @type {STATE} */ DAMAGEPIT = "damagePit";

    constructor() {
        this.previousState = null;
        this.currentState = null;
        this.time = 0;
    }

    /**
     * @param {STATE} newState
     */
    changeState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.time = 0;
    }

    update() {
        this.time++;
    }
}

class Player extends Entity {
    constructor(x, y, stage, hp, maxhp, hpBar) {
        const rect = new Rectangle(x, y, 24, 32);
        const hitbox = new Rectangle(7, 7, 10, 25);
        super("player", rect, hitbox, stage);
        this.hpBar = hpBar;
        this.hp = hp;
        this.maxhp = maxhp;
        this.state = new PlayerState();
        this.state.changeState(this.state.STAND);
        this.on("gravity", this.behavior.gravity);
        this.stopAtWall();
        this.floorPositions = [];
        this.on("goDownWall", () => {
            this.coyoteTime = 6;
            this.jump = 1;
            this.floorPositions.push([this.x, this.y]);
            if (this.floorPositions.length > 10) {
                this.floorPositions.shift();
            }
        });
        this.on("fallPit", () => {
            const [x, y] = this.floorPositions.shift();
            this.floorPositions = [[x, y]];
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
        });
        this.on("hitWind", this.behavior.WindJump);
        this.on("damageBlock", (x, isPit = false) => {
            this.damage(x, isPit);
        });
        this.on("inWater", this.behavior.inWater);
        this.playAnimation("stand");
        this.vx = 0;
        this.vy = 0;
        this.jump = 1;
        this.coyoteTime = 6;
        this.animationStopFrame = 0;
        this.noHitboxTime = 0;
        this.isFreezed = false;
    }

    /** @param {Input} input  */
    processInput(input) {
        if (input.getKey("r") == 1) {
            this.dispatch("reset");
        }

        if (this.isDead) return;

        const st = this.state.currentState;
        const cs = (s) => this.state.changeState(s);
        const move = () => {
            const speedX = 1.5;
            if (input.getKey("d") > 0) {
                if (st == this.state.STAND) cs(this.state.WALK);
                this.scaleX = 1;
                this.vx = speedX;
            } else if (input.getKey("a") > 0) {
                if (st == this.state.STAND) cs(this.state.WALK);
                this.scaleX = -1;
                this.vx = -speedX;
            } else {
                if (st == this.state.WALK) cs(this.state.STAND);
                this.vx = 0;
            }
        };
        const sit = () => {
            if (input.getKey("s") > 0) {
                cs(this.state.SIT);
                this.vx = 0;
                this.hitbox = new Rectangle(7, 16, 10, 16);
            }
        };
        const jump = () => {
            if (input.getKey("w") == 1) {
                if (this.jump == 1) {
                    cs(this.state.JUMP);
                    sounds.play("jump");
                    this.jump = 0;
                    this.vy = -3;
                }
            }
        };
        const wind = (vx) => {
            if (input.getKey(" ") == 1) {
                this.dispatch("makeWind", vx);
                if (st == this.state.WALK) {
                    if (this.animation == "windWalk2") {
                        this.animationForced("windWalk", 12);
                    } else {
                        this.animationForced("windWalk2", 12);
                    }
                } else {
                    this.animationForced("wind", 12);
                }
            }
        };
        const standUp = () => {
            if (input.getKey("s") <= 0) {
                this.state.changeState(this.state.STAND_UP);
                this.hitbox = new Rectangle(7, 7, 10, 25);
            }
        };

        switch (this.state.currentState) {
            // 立ち・歩き中
            case this.state.STAND:
            case this.state.WALK:
                if (this.jump == 0) {
                    cs(this.state.JUMP);
                }
                move();
                sit();
                jump();
                wind(this.scaleX == 1 ? 2 : -2);
                break;

            // ジャンプ中
            case this.state.JUMP:
                if (this.jump == 1) {
                    cs(this.state.STAND);
                }
                move();
                jump();
                wind(this.scaleX == 1 ? 2 : -2);
                break;

            // しゃがみ中
            case this.state.SIT:
                standUp();
                wind(0);
                break;

            // しゃがみ復帰中
            case this.state.STAND_UP:
                if (this.state.time >= 3) cs(this.state.STAND);
                break;

            // ダメージ中
            case this.state.DAMAGE:
                if (this.state.time >= 10) cs(this.state.STAND);
                break;

            // ダメージ中
            case this.state.DAMAGEPIT:
                if (this.state.time >= 40) {
                    this.dispatch("fallPit");
                    cs(this.state.STAND);
                }
                break;

            // 水中
            case this.state.INWATER:
                this.jump = 1;
                move();
                jump();
                wind(this.scaleX == 1 ? 2 : -2);
                break;

            default:
                console.error("state処理が見つかりません");
                break;
        }
    }

    update(input) {
        if (this.isFreezed) return;
        this.processInput(input);
        if (this.isDead) return;

        super.update();
        this.state.update();
        if (this.coyoteTime-- < 0) this.jump = 0;
        this.updateAnimation();
    }

    updateAnimation() {
        if (this.animationStopFrame-- > 0) return;
        if (this.noHitboxTime-- > 0 && this.noHitboxTime % 2 == 0) {
            this.alpha = 0;
        } else {
            this.alpha = 1;
        }

        let nextAnimation = "";
        switch (this.state.currentState) {
            case this.state.STAND:
                nextAnimation = "stand";
                break;
            case this.state.WALK:
                nextAnimation = "walk";
                break;
            case this.state.JUMP:
                if (this.vy <= 0) {
                    nextAnimation = "jumpUp";
                } else {
                    nextAnimation = "jumpDown";
                }
                break;
            case this.state.SIT:
                nextAnimation = "sit";
                break;
            case this.state.STAND_UP:
                nextAnimation = "standUp";
                break;
            case this.state.DAMAGE:
            case this.state.DAMAGEPIT:
                nextAnimation = "damage";
                break;
            default:
                console.error("state処理が見つかりません\n" + this.state.currentState);
                break;
        }

        if (this.animation != nextAnimation) {
            this.animation = nextAnimation;
            this.playAnimation(nextAnimation);
        }
    }

    animationForced(key, frame) {
        this.animationStopFrame = frame;
        this.animation = key;
        this.playAnimation(key);
    }

    damage(num, isPit = false) {
        if (this.noHitboxTime <= 0) {
            sounds.play("damage");
            const nextHp = Math.max(0, this.hp - num);
            num = this.hp - nextHp;
            this.hpBar.damage(num);
            this.hp -= num;
            this.vx = this.scaleX * -1;
            if (isPit) {
                this.vx = 0;
            }
            this.x -= this.vx;
            this.noHitboxTime = 50;
            if (this.hp <= 0) {
                this.isDead = true;
                this.animationForced("damage", 100);
                this.alpha = 1;
                this.dispatch("death");
            }
            if (isPit) {
                this.state.changeState(this.state.DAMAGEPIT);
            } else {
                this.state.changeState(this.state.DAMAGE);
            }
        }
    }

    heal(num) {
        sounds.play("heal");
        this.hp += num;
        this.hpBar.heal(num);
    }
}

class HPBar extends LayerActor {
    constructor(hp, maxHp) {
        const fontSize = 10;
        const hpLetterSize = fontSize * 1.5 + 3;
        const barWidth = 100;
        const barFrame = 1;
        const barHeight = 8;
        super(
            new Rectangle(10, 220, barWidth + 2 * barFrame + hpLetterSize, barHeight + 2 * barFrame)
        );
        this.barWidth = barWidth;
        const bg = new RectActor(
            "#000",
            new Rectangle(0, 0, barWidth + 2 * barFrame + hpLetterSize, barHeight + 2 * barFrame)
        ).addChildTo(this);
        const hpText = new TextActor("", 2, 0).addChildTo(this);
        hpText.font = fontSize + "px " + FONT;
        hpText.color = "#fff";
        hpText.textAlign = "left";
        hpText.textBaseline = "top";
        hpText.update = () => {
            if (this.hp >= 10) hpText.text = `*/${this.maxhp}`;
            else hpText.text = `${this.hp}/${this.maxhp}`;
            if (this.hp == 0) hpText.color = "#f00";
            else if (this.hp < this.maxhp) hpText.color = "#ff0";
            else if (this.hp == this.maxhp) hpText.color = "#fff";
            else hpText.color = "#0f0";
        };
        /*
        const makeFrameRect = (color, rect) => {
            new RectActor(color, new Rectangle(0, 0, rect.width, 1)).addChildTo(this);
            new RectActor(color, new Rectangle(0, 0, 1, rect.height)).addChildTo(this);
            new RectActor(color, new Rectangle(0, rect.height - 1, rect.width, 1)).addChildTo(this);
            new RectActor(color, new Rectangle(rect.width - 1, 0, 1, rect.height)).addChildTo(this);
        };
        makeFrameRect(
            "#000",
            new Rectangle(0, 0, barWidth + 2 * barFrame, barHeight + 2 * barFrame)
        );*/
        const gaugeRect = new Rectangle(hpLetterSize + barFrame, barFrame, barWidth, barHeight);
        const redBar = new RectActor("#f00", gaugeRect).addChildTo(this);
        const normalBar = new RectActor("#0f0", gaugeRect).addChildTo(this);
        this.cameraFollowRateX = this.cameraFollowRateY = 0;
        this.damageWaitTime = 0;
        normalBar.update = () => {
            const currentBarSize =
                this.hp < maxHp ? ((barWidth * this.hp) / this.maxhp) | 0 : barWidth;
            normalBar.color = "#0f0";
            // ダメージを受けたときは瞬時にその状態に
            if (currentBarSize <= normalBar.width) normalBar.width = currentBarSize;
            // 回復したときはゆっくり回復
            else {
                normalBar.width++;
                if (normalBar.time % 2 == 0) normalBar.color = "#fff";
            }

            // ダメージを受けたときはゆっくり赤バーを減らす
            if (normalBar.width < redBar.width) {
                if (this.damageWaitTime-- <= 0) {
                    redBar.width -= this.redBarDecreaseRate;
                    redBar.width = Math.max(0, redBar.width);
                }
            } else redBar.width = normalBar.width;
        };
        this.redBar = redBar;
        this.maxhp = maxHp;
        this.hp = hp;
    }

    get currentBarSize() {
        return ((this.barWidth * this.hp) / this.maxhp) | 0;
    }

    damage(num) {
        this.damageWaitTime = 10;
        this.hp -= num;
        this.redBarDecreaseRate = (this.redBar.width - this.currentBarSize) / 15;
    }

    heal(num) {
        this.hp += num;
    }
}
