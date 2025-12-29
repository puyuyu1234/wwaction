//@ts-check
"use strict";

class EntityBehavior {
  /**
   * @param {Entity} that
   */
  constructor(that) {
    this.gravity = () => {
      const gravity = 0.125;
      that.vy += gravity;
    };
    this.goLeftWallStop = () => {
      const wallPosition = that.currentHitbox.left - 1 + that.vx;
      that.x =
        ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE - that.hitbox.left;
      that.vx = 0;
    };
    this.goRightWallStop = () => {
      const wallPosition = that.currentHitbox.right + 1 + that.vx;
      that.x =
        ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.hitbox.right - 1;
      that.vx = 0;
    };
    this.goUpWallStop = () => {
      const wallPosition = that.currentHitbox.top + that.vy - 1;
      that.y =
        ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE -
        that.height +
        that.hitbox.height;
      that.vy = 0;
    };
    this.goDownWallStop = () => {
      const wallPosition = that.currentHitbox.bottom + that.vy + 1;
      that.y = ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.height;
      that.vy = 0;
    };
    this.goLeftWallBack = () => {
      const wallPosition = that.currentHitbox.left - 1 + that.vx;
      that.x =
        ((wallPosition / BLOCKSIZE + 1) | 0) * BLOCKSIZE - that.hitbox.left;
      that.vx *= -1;
    };
    this.goRightWallBack = () => {
      const wallPosition = that.currentHitbox.right + 1 + that.vx;
      that.x =
        ((wallPosition / BLOCKSIZE) | 0) * BLOCKSIZE - that.hitbox.right - 1;
      that.vx *= -1;
    };
    this.WindJump = () => {
      /** @type {StageScene} */
      let scene;
      let parent = that.parent;
      while (!(parent instanceof StageScene)) {
        parent = parent.parent;
      }
      scene = parent;
      const isInScreen = scene.camera.rectangle.hitTest(that.rectangle);
      if (isInScreen && scene.soundTimers.wind.time >= 0) {
        scene.soundTimers.wind.time = -5;
        sounds.play("jump");
      }
      that.vy = -3;
    };
    this.goRight = () => {
      that.vx = Math.abs(that.vx);
      that.scaleX = -1;
    };
    this.goLeft = () => {
      that.vx = -Math.abs(that.vx);
      that.scaleX = 1;
    };
    this.inWater = () => {
      that.isInWater = true;
      if (that instanceof Player) {
        that.jump = 1;
        that.coyoteTime = 3;
        //that.state.changeState(that.state.INWATER);
      }
    };
  }
}

class Entity extends SpriteActor {
  /**
   * @param {string} imageKey
   * @param {Rectangle} rectangle
   * @param {Rectangle} hitbox
   * @param {string[][]} stages
   */
  constructor(imageKey, rectangle, hitbox, stages, tags = []) {
    super(imageKey, rectangle, tags);
    this.hitbox = hitbox;
    this.stages = stages;
    this.vx = 0;
    this.vy = 0;
    this.entityKey = crypto.randomUUID();
    this.behavior = new EntityBehavior(this);
    this.isDead = false;
    this.isInWater = false;
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

  onCliffTurn() {
    this.on("rightFootOnCliff", this.behavior.goRight);
    this.on("leftFootOnCliff", this.behavior.goLeft);
  }

  update() {
    // 重力
    this.dispatch("gravity");

    const stage = this.stages[0];
    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {BlockData}
     */
    const getBlockData = (x, y) => {
      let bx = Math.floor(x / BLOCKSIZE),
        by = Math.floor(y / BLOCKSIZE);

      const stageHeight = stage.length * BLOCKSIZE;
      const stageWidth = stage[0].length * BLOCKSIZE;
      if (x < 0 || x > stageWidth) return new BlockData([], 15);
      if (y < 0) return new BlockData([], 0);
      if (y > stageHeight + 32) {
        return new BlockData([], 100, {
          hitbox: new Rectangle(0, 0, 16, 16),
          damage: 999,
        });
      }
      if (stage[by] == undefined) return new BlockData([], 0);
      if (stage[by][bx] == undefined) return new BlockData([], 15);
      return BLOCKDATA[stage[by][bx]];
    };

    // ブロック判定
    const getBlockType = (x, y) => getBlockData(x, y).type;

    // 壁判定
    const isWall = (x, y, flag) => (getBlockType(x, y) % 100 & flag) == flag;
    const isDifferentPosition = (x1, x2) =>
      Math.floor(x1 / BLOCKSIZE) != Math.floor(x2 / BLOCKSIZE);

    // 壁以外判定
    const isBlockType = (x, y, flag) =>
      Math.floor(getBlockType(x, y) / 100) * 100 == flag;

    {
      // 左・当たり判定が縦長の場合を考慮
      const left = this.currentHitbox.left + this.vx;
      if (
        isDifferentPosition(this.currentHitbox.left, left - 1) &&
        makeRangeWithEnd(
          this.currentHitbox.top,
          this.currentHitbox.bottom,
          BLOCKSIZE
        ).some((y) => isWall(left - 1, y, 8))
      ) {
        if (this.vx < 0) {
          this.dispatch("goLeftWall");
        }
      }
    }

    {
      // 右
      const right = this.currentHitbox.right + this.vx;
      if (
        isDifferentPosition(this.currentHitbox.right, right + 1) &&
        makeRangeWithEnd(
          this.currentHitbox.top,
          this.currentHitbox.bottom,
          BLOCKSIZE
        ).some((y) => isWall(right + 1, y, 4))
      ) {
        if (this.vx > 0) {
          this.dispatch("goRightWall");
        }
      }
    }

    {
      // 天井
      const top = this.currentHitbox.top + this.vy;
      if (
        isDifferentPosition(this.currentHitbox.top, top - 1) &&
        makeRangeWithEnd(
          this.currentHitbox.left + this.vx,
          this.currentHitbox.right + this.vx,
          BLOCKSIZE
        ).some((x) => isWall(x, top - 1, 2))
      ) {
        if (this.vy < 0) {
          this.dispatch("goUpWall");
        }
      }
    }

    {
      // 接地
      const bottom = this.currentHitbox.bottom + this.vy;
      if (
        isDifferentPosition(this.currentHitbox.bottom, bottom + 1) &&
        makeRangeWithEnd(
          this.currentHitbox.left + this.vx,
          this.currentHitbox.right + this.vx,
          BLOCKSIZE
        ).some((x) => isWall(x, bottom + 1, 1))
      ) {
        if (this.vy > 0) {
          this.dispatch("goDownWall");
        }

        // 左右のどちらかが崖から出ている場合のイベント
        if (!isWall(this.currentHitbox.left + this.vx, bottom + 1, 1)) {
          this.dispatch("rightFootOnCliff");
        }
        if (!isWall(this.currentHitbox.right + this.vx, bottom + 1, 1)) {
          this.dispatch("leftFootOnCliff");
        }
      }
    }

    const xList = makeRangeWithEnd(
      this.currentHitbox.left,
      this.currentHitbox.right,
      BLOCKSIZE
    );
    const yList = makeRangeWithEnd(
      this.currentHitbox.top,
      this.currentHitbox.bottom,
      BLOCKSIZE
    );

    const findMatchingPair = (xs, ys, condition) => {
      return xs.reduce((found, x) => {
        return (
          found ||
          ys.reduce((innerFound, y) => {
            return innerFound || (condition(x, y) ? { x, y } : null);
          }, null)
        );
      }, null);
    };

    {
      // ダメージブロック
      let result;
      if (
        (result = findMatchingPair(xList, yList, (x, y) =>
          isBlockType(x, y, 100)
        ))
      ) {
        const x = result.x;
        const y = result.y;
        let bx = Math.floor(x / BLOCKSIZE),
          by = Math.floor(y / BLOCKSIZE);
        const blockParam = getBlockData(x, y).param;
        const hitRect = new Rectangle(
          bx * BLOCKSIZE + blockParam.hitbox.x,
          by * BLOCKSIZE + blockParam.hitbox.y,
          blockParam.hitbox.width,
          blockParam.hitbox.height
        );
        if (this.currentHitbox.hitTest(hitRect)) {
          if (blockParam.damage == 999) {
            this.dispatch("damageBlock", 1, true);
          } else {
            this.dispatch("damageBlock", blockParam.damage, false);
          }
        }
      }

      // 水中
      if (
        (result = findMatchingPair(xList, yList, (x, y) =>
          isBlockType(x, y, 200)
        ))
      ) {
        this.dispatch("inWater");
      } else {
        this.isInWater = false;
      }
    }

    if (this.isInWater) {
      this.x += this.vx;
      this.y += this.vy / 2;
    } else {
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  get currentHitbox() {
    return new Rectangle(
      this.x + this.hitbox.x,
      this.y + this.hitbox.y,
      this.hitbox.width,
      this.hitbox.height
    );
  }

  /**
   * @param {Player} player
   */
  collision(player) {}
}

class Wind extends Entity {
  constructor(x, y, vx, stage) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(3, 0, 10, 16);
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

class Gurasan extends Entity {
  constructor(x, y, stage) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(4, 4, 8, 12);
    super("entity", rect, hitbox, stage, ["hit"]);
    this.vx = -1 / 2;
    this.on("gravity", this.behavior.gravity);
    this.backAtLRWall();
    this.on("goLeftWall", () => (this.scaleX *= -1));
    this.on("goRightWall", () => (this.scaleX *= -1));
    this.on("hitWind", () => {
      const nasake = new Nasake(this.x, this.y, this.stages).addChildTo(
        this.parent
      );
      nasake.scaleX = this.vx * -2;
      nasake.vx = this.vx / 2;
      this.dispatch("spawn", nasake);
      const sunGlass = new SunGlass(
        this.x,
        this.y,
        -this.vx,
        this.stages
      ).addChildTo(this.parent);
      this.dispatch("spawn", sunGlass);
      this.destroy();
    });

    this.playAnimation("gurasan");
  }

  collision(player) {
    player.damage(1);
  }
}

class GurasanNotFall extends Gurasan {
  constructor(x, y, stage) {
    super(x, y, stage);
    this.onCliffTurn();
  }
}

class SunGlass extends Entity {
  constructor(x, y, vx, stage) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(0, 0, 16, 16);
    super("entity", rect, hitbox, stage, []);
    this.vx = vx;
    this.on("gravity", this.behavior.gravity);
    this.on("hitWind", this.behavior.WindJump);

    this.playAnimation("sunGlass");
  }
}

class GoalEntity extends Entity {
  constructor(rect) {
    super("block", new Rectangle(0, 0, 0, 0), rect, [[""]], ["hit"]);
    this.playAnimation(" ");
  }

  update() {}

  render() {}

  collision(player) {
    player.dispatch("nextStage");
  }
}

class Potion extends Entity {
  constructor(x, y, stage) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(4, 4, 8, 12);
    super("entity", rect, hitbox, stage, ["hit"]);
    this.on("gravity", this.behavior.gravity);
    this.stopAtWall();
    this.on("hitWind", this.behavior.WindJump);

    this.playAnimation("potion");
  }

  collision(player) {
    player.heal(1);
    this.destroy();
  }
}

class Nuefu extends Entity {
  constructor(x, y, stage) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(4, 4, 8, 12);
    super("entity", rect, hitbox, stage, ["hit"]);
    this.vx = -1 / 2;
    this.on("gravity", this.behavior.gravity);
    this.backAtLRWall();
    this.on("goLeftWall", () => (this.scaleX *= -1));
    this.on("goRightWall", () => (this.scaleX *= -1));
    this.on("hitWind", this.behavior.WindJump);
    this.onCliffTurn();

    this.playAnimation("nuefu");
  }

  collision(player) {
    player.damage(1);
  }
}

class EntityData {
  /**
   * @param {string} key
   * @param {typeof Nasake} cl
   */
  constructor(key, cl) {
    this.key = key;
    this.cl = cl;
  }
}
/** @type {Object<string, EntityData>} */
const ENTITYDATA = {
  0: new EntityData(null, null),
  1: new EntityData("nasake", Nasake),
  2: new EntityData("gurasan", Gurasan),
  3: new EntityData("potion", Potion),
  4: new EntityData("gurasan", GurasanNotFall),
  5: new EntityData("nuefu", Nuefu),
  "*": new EntityData(null, null),
};
