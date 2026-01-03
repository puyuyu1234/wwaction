import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { StageLayers } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

/**
 * Shimi（シミ）エンティティ
 * - Nasakeと同じくシンプルな敵
 * - 左右に移動し、壁で反転
 * - 風で跳ねる
 * - 重力が適用される
 */
export class Shimi extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(centerX: number, centerY: number, stage: StageLayers) {
    // スプライトサイズ: 32x16
    // hitbox: 左上(8,5)から16x11 → 中心基準: (-8, -3, 16, 11)
    const hitbox = new Rectangle(-8, -3, 16, 11)

    super('entity', centerX, centerY, 32, 16, hitbox, [])

    this.vx = -2 // 左方向移動
    this.scale.x = 1 // 敵は左向き時に scale.x = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    this.playAnimation('shimi')
  }

  tick() {
    super.tick()

    this.physics.applyGravity()
    CommonBehaviors.bounceWalls(this, this.tilemap)
    this.physics.applyVelocity()
  }
}
