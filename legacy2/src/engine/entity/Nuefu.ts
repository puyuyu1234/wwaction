import { PhysicsComponent } from '@components/PhysicsComponent'
import { TilemapCollisionComponent } from '@components/TilemapCollisionComponent'
import { Rectangle } from '@core/Rectangle'

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

  constructor(centerX: number, centerY: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16
    const rect = new Rectangle(centerX, centerY, 16, 16)

    // hitboxも中心基準に変換: legacy(4,4,8,12) → 中心基準(-4,-4,8,12)
    // 計算: (4-8, 4-8) = (-4, -4)
    const hitbox = new Rectangle(-4, -4, 8, 12)

    // タグ 'enemy': Playerの衝突反応で参照される（ダメージを与える）
    // imageKey は 'entity' スプライトシートを参照
    super('entity', rect, hitbox, stage, ['enemy'])

    this.vx = -0.5 // 左方向に移動
    this.scaleX = 1 // 敵は左向き時に scaleX = 1

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

  update() {
    this.physics.applyGravity()

    // 横壁: 反転
    CommonBehaviors.bounceHorizontalWalls(this, this.tilemap)

    // 縦壁: 停止＋崖検知
    CommonBehaviors.stopVerticalWallsWithCliffDetection(this, this.tilemap)

    this.physics.applyVelocity()
  }
}
