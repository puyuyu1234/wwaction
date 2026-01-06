import { CollisionReactionComponent } from '@game/components/CollisionReactionComponent'
import { AnimatedSpriteActor } from '@ptre/actor/AnimatedSpriteActor'
import { Rectangle } from '@ptre/core/Rectangle'

/**
 * ゲームエンティティ基底クラス
 * - 速度(vx, vy)を持つ
 * - hitboxで当たり判定
 * - collisionReaction: エンティティ間衝突の反応を管理
 * - AnimatedSpriteActorを継承してスプライト表示
 * - 物理座標(_posX, _posY)と描画座標(x, y)を分離してサブピクセル揺れを防止
 */
export class Entity extends AnimatedSpriteActor {
  vx = 0
  vy = 0
  protected collisionReaction = new CollisionReactionComponent()

  // 物理座標（小数）
  private _posX = 0
  private _posY = 0

  constructor(
    imageKey: string,
    x: number,
    y: number,
    width: number,
    height: number,
    public hitbox: Rectangle,
    tags: string[] = []
  ) {
    super(imageKey, Math.floor(x), Math.floor(y), width, height, tags)
    this._posX = x
    this._posY = y
  }

  /** X座標（物理計算は小数、描画は整数に丸められる） */
  override get x(): number {
    return this._posX
  }

  override set x(value: number) {
    this._posX = value
    super.x = Math.floor(value)
  }

  /** Y座標（物理計算は小数、描画は整数に丸められる） */
  override get y(): number {
    return this._posY
  }

  override set y(value: number) {
    this._posY = value
    super.y = Math.floor(value)
  }

  /**
   * タグ一覧を取得（behavior.tagsへのショートカット）
   */
  get tags(): Set<string> {
    return this.behavior.tags
  }

  /**
   * 他のエンティティとの衝突を処理（CollisionReactionComponent経由）
   * @param other 衝突相手のエンティティ
   */
  handleCollision(other: Entity) {
    this.collisionReaction.handle(other)
  }

  /** 現在位置でのhitbox（ワールド座標） */
  get currentHitbox(): Rectangle {
    return new Rectangle(
      this.x + this.hitbox.x,
      this.y + this.hitbox.y,
      this.hitbox.width,
      this.hitbox.height
    )
  }
}
