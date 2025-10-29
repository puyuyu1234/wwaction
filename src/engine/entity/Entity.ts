import { SpriteActor } from '@/engine/actor/SpriteActor'
import { CollisionReactionComponent } from '@components/CollisionReactionComponent'
import { Rectangle } from '@core/Rectangle'

/**
 * ゲームエンティティ基底クラス
 * - vx, vy: 速度
 * - collisionReaction: エンティティ間衝突の反応を管理
 * - hitbox: 当たり判定領域
 * - physics, tilemap は各サブクラスで必要に応じて保持
 */
export class Entity extends SpriteActor {
  vx = 0
  vy = 0

  protected collisionReaction = new CollisionReactionComponent()

  constructor(
    imageKey: string,
    rectangle: Rectangle,
    public hitbox: Rectangle,
    protected stage: string[][],
    tags: string[] = []
  ) {
    super(imageKey, rectangle, tags)
  }

  update() {
    // サブクラスでオーバーライド
  }

  /**
   * エンティティを削除
   * destroyイベントを発火してから削除処理を行う
   */
  destroy() {
    this.dispatch('destroy', this)
  }

  /**
   * 他のエンティティとの衝突を処理（CollisionReactionComponent経由）
   * CollisionReactionComponentがタグベースで反応を実行する
   * @param other 衝突相手のエンティティ
   */
  handleCollision(other: Entity) {
    this.collisionReaction.handle(other)
  }

  get currentHitbox(): Rectangle {
    return new Rectangle(
      this.x + this.hitbox.x,
      this.y + this.hitbox.y,
      this.hitbox.width,
      this.hitbox.height
    )
  }
}
