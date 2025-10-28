import { Entity } from './Entity'

import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { Rectangle } from '@/core/Rectangle'

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
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(4, 4, 8, 12)

    // タグ 'enemy': Playerの衝突反応で参照される（ダメージを与える）
    super('nuefu', rect, hitbox, stage, ['enemy'])

    this.vx = -0.5 // 左方向に移動

    // 必要なComponentを初期化
    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, stage)

    // 風との衝突反応を設定
    this.collisionReaction.on('wind', () => {
      this.vy = -3 // WindJump
    })
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定（跳ね返る）
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
      // 向きを反転（元のJS実装の scaleX *= -1 に相当）
      // TODO: scaleX はまだ実装されていないため、後で追加
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
      // 向きを反転
      // TODO: scaleX はまだ実装されていないため、後で追加
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
        // TODO: scaleX = 1
      }
      // 左側が崖 → 右方向へ
      if (this.tilemap.checkLeftSideCliff()) {
        this.vx = Math.abs(this.vx)
        // TODO: scaleX = -1
      }
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
