import { Entity } from "./Entity";
import { Rectangle } from "@/core/Rectangle";
import { Input } from "@/core/Input";
import { PhysicsComponent } from "@/components/PhysicsComponent";
import { TilemapCollisionComponent } from "@/components/TilemapCollisionComponent";

/**
 * プレイヤーエンティティ
 * - WASD で移動・ジャンプ
 * - コヨーテタイム実装
 */
export class Player extends Entity {
  private input: Input;
  private coyoteTime = 0; // 空中にいる時間（コヨーテタイム用）
  private readonly COYOTE_TIME_MAX = 6; // コヨーテタイム最大フレーム数
  private readonly MOVE_SPEED = 2;
  private readonly JUMP_POWER = -4;
  private readonly WIND_JUMP_POWER = -3; // 風との衝突時のジャンプ力

  // HP関連
  public hp: number;
  public maxHp: number;
  private noHitboxTime = 0; // 無敵時間（ダメージ後の猶予）
  public isDead = false;

  // Components（型安全に保持）
  private physics: PhysicsComponent;
  private tilemap: TilemapCollisionComponent;

  constructor(x: number, y: number, stage: string[][], input: Input, hp: number, maxHp: number) {
    const rect = new Rectangle(x, y, 16, 16);
    const hitbox = new Rectangle(4, 0, 8, 16);
    super("player", rect, hitbox, stage, []);

    this.input = input;
    this.hp = hp;
    this.maxHp = maxHp;

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this);
    this.tilemap = new TilemapCollisionComponent(this, stage);

    // 衝突反応を登録（元のJS実装の on("hitWind", ...) に相当）
    this.setupCollisionReactions();
  }

  /**
   * 各種エンティティとの衝突時の反応を設定
   */
  private setupCollisionReactions() {
    // 風との衝突: WindJump
    this.collisionReaction.on('wind', () => {
      this.vy = this.WIND_JUMP_POWER;
    });

    // 敵との衝突: 1ダメージ
    this.collisionReaction.on('enemy', () => {
      this.damage(1);
    });

    // 回復アイテムとの衝突: HP回復 + アイテム消滅
    this.collisionReaction.on('healing', (item) => {
      this.heal(1);
      // アイテムを削除（元のJS実装の destroy() に相当）
      item.destroy();
    });
  }

  update() {
    // 死亡時は更新しない
    if (this.isDead) return;

    // 無敵時間の更新
    if (this.noHitboxTime > 0) {
      this.noHitboxTime--;
    }

    // 重力
    this.physics.applyGravity();

    // 左右移動
    if (this.input.isKeyDown("KeyA")) {
      this.vx = -this.MOVE_SPEED;
    } else if (this.input.isKeyDown("KeyD")) {
      this.vx = this.MOVE_SPEED;
    } else {
      this.vx = 0;
    }

    // ジャンプ（コヨーテタイム対応）
    if (this.input.isKeyPressed("KeyW")) {
      if (this.coyoteTime < this.COYOTE_TIME_MAX) {
        this.vy = this.JUMP_POWER;
        this.coyoteTime = this.COYOTE_TIME_MAX; // ジャンプしたらコヨーテタイム消費
      }
    }

    // 壁判定（停止）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.stopAtLeftWall();
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.stopAtRightWall();
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall();
    }

    // 床判定
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall();
      this.coyoteTime = 0; // 着地したらコヨーテタイムリセット
    } else {
      // 空中にいる場合、コヨーテタイムを増やす
      this.coyoteTime++;
    }

    // 速度適用
    this.physics.applyVelocity();
  }

  /**
   * ダメージを受ける
   * @param num ダメージ量
   */
  damage(num: number) {
    // 無敵時間中はダメージを受けない
    if (this.noHitboxTime > 0) return;

    // HPを減らす（最小0）
    this.hp = Math.max(0, this.hp - num);

    // ノックバック（scaleXの逆方向に押し出す）
    this.vx = this.vx > 0 ? -1 : 1;

    // 無敵時間を設定（約0.8秒）
    this.noHitboxTime = 50;

    // ダメージイベント発火（HPBar更新用）
    this.dispatch('playerDamage', num);

    // 死亡判定
    if (this.hp <= 0) {
      this.isDead = true;
      this.dispatch('death'); // イベント発火（将来的にゲームオーバー処理で使用）
    }
  }

  /**
   * 回復する
   * @param num 回復量
   */
  heal(num: number) {
    this.hp = Math.min(this.maxHp, this.hp + num);
  }

  /**
   * 無敵時間中かどうか
   */
  isInvincible(): boolean {
    return this.noHitboxTime > 0;
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    return {
      x: this.x.toFixed(2),
      y: this.y.toFixed(2),
      vx: this.vx.toFixed(2),
      vy: this.vy.toFixed(2),
      coyoteTime: this.coyoteTime,
      coyoteTimeMax: this.COYOTE_TIME_MAX,
      onGround: this.coyoteTime === 0,
      hp: this.hp,
      maxHp: this.maxHp,
      invincible: this.isInvincible(),
      isDead: this.isDead,
    };
  }
}
