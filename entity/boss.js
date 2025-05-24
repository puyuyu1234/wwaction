// @ts-check
/// <reference path="entity.js" />
"use strict";

class DekaNasake extends Entity {
    constructor(x, y, stage) {
        const rect = new Rectangle(x, y, 32, 32);
        const hitbox = new Rectangle(8, 6, 16, 26);
        super("deka", rect, hitbox, stage, ["hit"]);
        this.direction = -1;
        this.on("gravity", this.behavior.gravity);
        this.backAtLRWall();
        this.on("goLeftWall", () => (this.scaleX *= -1));
        this.on("goRightWall", () => (this.scaleX *= -1));
        this.on("rightFootOnCliff", this.OnCliff.bind(this, 1));
        this.on("leftFootOnCliff", this.OnCliff.bind(this, -1));
        this.hitWindTimer = 0;
        this.on("hitWind", (/** @type {Wind} */ wind) => {
            if (this.hitWindTimer <= 0) {
                this.hitWindTimer = this.timer.hitWind;
                this.vx = wind.vx;
                wind.vx *= -1;
                this.state = "hitWind";
                this.playAnimation("stand");
            }
        });
        this.cliffTimer = 120;
        this.state = "walk";
        this.timer = {
            hitWind: 12,
            run: 24,
        };

        this.playAnimation("purupuru");
    }

    update() {
        this.cliffTimer--;
        switch (this.state) {
            case "walk":
                this.vx = (this.direction * 3) / 4;
                break;
            case "hitWind":
                if (this.hitWindTimer-- <= 0) {
                    this.state = "run";
                    this.playAnimation("purupuru");
                    this.runTimer = this.timer.run;
                }
                break;
            case "run":
                if (this.runTimer-- <= 0) {
                    this.state = "walk";
                }
                this.vx = this.direction;
                break;
        }

        super.update();
    }

    OnCliff(nextDirection) {
        if (this.state == "walk") {
            if (this.cliffTimer <= 0) {
                this.cliffTimer = 120;
                this.direction = Math.abs(this.direction) * nextDirection;
                this.scaleX = -nextDirection;
            }
        }
    }

    collision(player) {
        player.damage(1);
    }
}

class Kami extends Entity {
    constructor(x, y, stage) {
        const rect = new Rectangle(x, y, 32, 32);
        const hitbox = new Rectangle(8, 6, 16, 26);
        super("deka", rect, hitbox, stage, ["hit"]);
        this.direction = -1;
        this.on("gravity", this.behavior.gravity);
        this.backAtLRWall();
        this.on("goLeftWall", () => (this.scaleX *= -1));
        this.on("goRightWall", () => (this.scaleX *= -1));
        this.on("rightFootOnCliff", this.OnCliff.bind(this, 1));
        this.on("leftFootOnCliff", this.OnCliff.bind(this, -1));
        this.hitWindTimer = 0;
        this.on("hitWind", (/** @type {Wind} */ wind) => {
            if (this.hitWindTimer <= 0) {
                this.hitWindTimer = this.timer.hitWind;
                this.vx = wind.vx;
                wind.vx *= -1;
                this.state = "hitWind";
                this.playAnimation("stand");
            }
        });
        this.cliffTimer = 120;
        this.state = "walk";
        this.timer = {
            hitWind: 12,
            run: 24,
        };

        this.on("add", (/** @type {StageScene} */ scene) => {
            new Talk(TALKTEXT.kami).addChildTo(scene);
        });
    }

    update() {
        /*
        this.cliffTimer--;
        switch (this.state) {
            case "walk":
                this.vx = (this.direction * 3) / 4;
                break;
            case "hitWind":
                if (this.hitWindTimer-- <= 0) {
                    this.state = "run";
                    this.playAnimation("purupuru");
                    this.runTimer = this.timer.run;
                }
                break;
            case "run":
                if (this.runTimer-- <= 0) {
                    this.state = "walk";
                }
                this.vx = this.direction;
                break;
        }

        super.update();
        */
    }

    OnCliff(nextDirection) {
        if (this.state == "walk") {
            if (this.cliffTimer <= 0) {
                this.cliffTimer = 120;
                this.direction = Math.abs(this.direction) * nextDirection;
                this.scaleX = -nextDirection;
            }
        }
    }

    collision(player) {
        player.damage(1);
    }
}
