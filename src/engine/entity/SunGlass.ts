import { PhysicsComponent } from '@components/PhysicsComponent'
import { Rectangle } from '@core/Rectangle'

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

  constructor(x: number, y: number, vx: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16、中心座標に変換: x+8, y+8
    const centerX = x + 8
    const centerY = y + 8
    const rect = new Rectangle(centerX, centerY, 16, 16)

    // hitboxも中心基準に変換: legacy(0,0,16,16) → 中心基準(-8,-8,16,16)
    // 計算: (0-8, 0-8) = (-8, -8)
    const hitbox = new Rectangle(-8, -8, 16, 16)

    // タグなし（誰も参照しないため）
    // imageKey は 'entity' スプライトシートを参照
    super('entity', rect, hitbox, stage, [])

    this.vx = vx

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)

    // 風との衝突反応を設定: 跳ねる
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    // entity.json では 'sunGlass' という名前で定義されている
    this.playAnimation('sunGlass')
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定は行わない（元の実装でも壁イベントが設定されていない）

    // 速度適用
    this.physics.applyVelocity()
  }
}
