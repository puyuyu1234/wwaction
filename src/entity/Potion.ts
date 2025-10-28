import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { Rectangle } from '@/core/Rectangle'

/**
 * Potion（回復アイテム）エンティティ
 * - プレイヤーに取得されるとHPを1回復
 * - 重力が適用される
 * - 壁で停止
 * - 風で跳ねる
 * - 取得後は消滅
 */
export class Potion extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(x: number, y: number, stage: string[][]) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(4, 4, 8, 12)

    // タグ 'healing': Playerの衝突反応で参照される
    super('potion', rect, hitbox, stage, ['healing'])

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定（停止）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.stopAtLeftWall()
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.stopAtRightWall()
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
