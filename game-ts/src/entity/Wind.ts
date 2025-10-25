import { Entity } from './Entity'
import { Rectangle } from '@/core/Rectangle'

/**
 * 風エンティティ
 * - 水平方向に移動
 * - 重力が適用される
 * - 壁で跳ね返る
 */
export class Wind extends Entity {
  constructor(x: number, y: number, vx: number, stage: string[][]) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(2, 1, 12, 15)
    super('wind', rect, hitbox, stage)

    this.vx = vx
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定 (跳ね返る)
    if (this.collision.checkLeftWall() && this.vx < 0) {
      this.collision.bounceAtLeftWall()
    }
    if (this.collision.checkRightWall() && this.vx > 0) {
      this.collision.bounceAtRightWall()
    }
    if (this.collision.checkUpWall() && this.vy < 0) {
      this.collision.stopAtUpWall()
    }
    if (this.collision.checkDownWall() && this.vy > 0) {
      this.collision.stopAtDownWall()
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
