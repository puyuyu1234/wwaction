import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { CollisionReactionComponent } from '@/components/CollisionReactionComponent'
import { SpriteActor } from '@/actor/SpriteActor'
import { Rectangle } from '@/core/Rectangle'

/**
 * ゲームエンティティ基底クラス
 * Component風継承: PhysicsComponent と TilemapCollisionComponent を必要に応じて所有
 */
export class Entity extends SpriteActor {
  vx = 0
  vy = 0

  protected physics?: PhysicsComponent
  protected collision?: TilemapCollisionComponent
  protected collisionReaction = new CollisionReactionComponent()

  constructor(
    imageKey: string,
    rectangle: Rectangle,
    public hitbox: Rectangle,
    protected stage: string[][]
  ) {
    super(imageKey, rectangle)

    // Componentはサブクラスで必要に応じて初期化
  }

  update() {
    // サブクラスでオーバーライド
  }

  /**
   * 他のエンティティとの衝突を処理
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
