import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

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

  constructor(centerX: number, centerY: number, vx: number) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    // hitboxも中心基準: (-8,-8,16,16)
    const hitbox = new Rectangle(-8, -8, 16, 16)

    // タグなし（誰も参照しないため）
    super('entity', centerX, centerY, 16, 16, hitbox, [])

    this.vx = vx

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)

    // 風との衝突反応を設定: 跳ねる
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    this.playAnimation('sunGlass')
  }

  tick() {
    super.tick()

    // 重力
    this.physics.applyGravity()

    // 壁判定は行わない（元の実装でも壁イベントが設定されていない）

    // 速度適用
    this.physics.applyVelocity()
  }
}
