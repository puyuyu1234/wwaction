import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { SpriteActor } from '@/actor/SpriteActor'
import { Rectangle } from '@/core/Rectangle'

/**
 * ゲームエンティティ基底クラス
 * Component風継承: PhysicsComponent と TilemapCollisionComponent を所有
 */
export class Entity extends SpriteActor {
  vx = 0
  vy = 0

  protected physics: PhysicsComponent
  protected collision: TilemapCollisionComponent

  constructor(
    imageKey: string,
    rectangle: Rectangle,
    public hitbox: Rectangle,
    protected stage: string[][]
  ) {
    super(imageKey, rectangle)

    // Component初期化
    this.physics = new PhysicsComponent(this)
    this.collision = new TilemapCollisionComponent(this, stage)
  }

  update() {
    // サブクラスでオーバーライド
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
