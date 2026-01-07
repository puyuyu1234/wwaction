import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { StageContext } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

/**
 * Nasake（ナサケ）エンティティ
 * - 最もシンプルな敵（プレイヤーにダメージを与えない）
 * - 左右に移動し、壁で反転
 * - 風で跳ねる
 * - 重力が適用される
 */
export class Nasake extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(centerX: number, centerY: number, context: StageContext) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    // hitboxも中心基準: (-4,-4,8,12)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグなし（誰も参照しないため）
    // 将来ダメージを与える敵にする場合は ['enemy'] を追加
    super('entity', centerX, centerY, 16, 16, hitbox, [])

    this.vx = -0.25 // 左方向にゆっくり移動
    this.scale.x = 1 // 敵は左向き時に scale.x = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, context)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    this.playAnimation('nasake')
  }

  tick() {
    super.tick()

    this.physics.applyGravity()
    CommonBehaviors.bounceWalls(this, this.tilemap)
    this.physics.applyVelocity()
  }
}
