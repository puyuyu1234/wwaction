import { Entity } from './Entity'

import { PhysicsComponent } from '@/components/PhysicsComponent'
import { Rectangle } from '@/core/Rectangle'

/**
 * SunGlass（サングラス）エンティティ
 * - Gurasan が風に触れたときに分裂して生成される
 * - 水平方向に移動
 * - 重力が適用される
 * - 壁との衝突判定は行わない（通り抜ける）
 * - 風で跳ねる
 */
export class SunGlass extends Entity {
  private physics: PhysicsComponent

  constructor(x: number, y: number, vx: number, stage: string[][]) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(0, 0, 16, 16)

    // タグなし（誰も参照しないため）
    super('sunglass', rect, hitbox, stage, [])

    this.vx = vx

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)

    // 風との衝突反応を設定: 跳ねる
    this.collisionReaction.on('wind', () => {
      this.vy = -3 // WindJump
    })
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定は行わない（元の実装でも壁イベントが設定されていない）

    // 速度適用
    this.physics.applyVelocity()
  }
}
