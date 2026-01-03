import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { StageLayers } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

/**
 * Nuefu（ヌエフ）エンティティ
 * - プレイヤーにダメージを与える敵
 * - 左右に移動し、壁で反転
 * - 崖で方向転換（落ちない）
 * - 風で跳ねる
 * - 重力が適用される
 */
export class Nuefu extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  constructor(centerX: number, centerY: number, stage: StageLayers) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    // hitboxも中心基準: (-4,-4,8,12)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグ 'enemy': Playerの衝突反応で参照される（ダメージを与える）
    super('entity', centerX, centerY, 16, 16, hitbox, ['enemy'])

    this.vx = -0.5 // 左方向に移動
    this.scale.x = 1 // 敵は左向き時に scale.x = 1

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // スプライトアニメーション初期化
    this.playAnimation('nuefu')
  }

  tick() {
    super.tick()

    this.physics.applyGravity()

    // 横壁: 反転
    CommonBehaviors.bounceHorizontalWalls(this, this.tilemap)

    // 縦壁: 停止＋崖検知
    CommonBehaviors.stopVerticalWallsWithCliffDetection(this, this.tilemap)

    this.physics.applyVelocity()
  }
}
