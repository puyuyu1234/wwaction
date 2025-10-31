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

  constructor(x: number, y: number, stage: string[][]) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // スプライトサイズ: 16x16、中心座標に変換: x+8, y+8
    const centerX = x + 8
    const centerY = y + 8
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
    // 重力
    this.physics.applyGravity()

    // 壁判定（跳ね返る）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      // 向きを反転（敵は vx > 0 で scaleX = -1）
      this.scaleX = -1 // 右向き
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      // 向きを反転
      this.scaleX = 1 // 左向き
    }
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.stopAtDownWall()

      // 崖判定（接地している時のみ）
      // 右側が崖 → 左方向へ
      if (this.tilemap.checkRightSideCliff()) {
        this.vx = -Math.abs(this.vx)
        this.scaleX = 1 // 敵は左向き時に scaleX = 1
      }
      // 左側が崖 → 右方向へ
      if (this.tilemap.checkLeftSideCliff()) {
        this.vx = Math.abs(this.vx)
        this.scaleX = -1 // 敵は右向き時に scaleX = -1
      }
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
