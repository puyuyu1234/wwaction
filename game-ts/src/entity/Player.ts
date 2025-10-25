import { Entity } from './Entity'
import { Rectangle } from '@/core/Rectangle'
import { Input } from '@/core/Input'

/**
 * プレイヤーエンティティ
 * - WASD で移動・ジャンプ
 * - Space で風を発射
 * - コヨーテタイム実装
 */
export class Player extends Entity {
  private input: Input
  private coyoteTime = 0 // 空中にいる時間（コヨーテタイム用）
  private readonly COYOTE_TIME_MAX = 6 // コヨーテタイム最大フレーム数
  private readonly MOVE_SPEED = 2
  private readonly JUMP_POWER = -4

  constructor(x: number, y: number, stage: string[][], input: Input) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = new Rectangle(4, 0, 8, 16)
    super('player', rect, hitbox, stage)

    this.input = input
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 左右移動
    if (this.input.isKeyDown('a') || this.input.isKeyDown('ArrowLeft')) {
      this.vx = -this.MOVE_SPEED
    } else if (this.input.isKeyDown('d') || this.input.isKeyDown('ArrowRight')) {
      this.vx = this.MOVE_SPEED
    } else {
      this.vx = 0
    }

    // ジャンプ（コヨーテタイム対応）
    if (this.input.isKeyPressed('w') || this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed(' ')) {
      if (this.coyoteTime < this.COYOTE_TIME_MAX) {
        this.vy = this.JUMP_POWER
        this.coyoteTime = this.COYOTE_TIME_MAX // ジャンプしたらコヨーテタイム消費
      }
    }

    // 壁判定（停止）
    if (this.collision.checkLeftWall() && this.vx < 0) {
      this.collision.stopAtLeftWall()
    }
    if (this.collision.checkRightWall() && this.vx > 0) {
      this.collision.stopAtRightWall()
    }
    if (this.collision.checkUpWall() && this.vy < 0) {
      this.collision.stopAtUpWall()
    }

    // 床判定
    if (this.collision.checkDownWall() && this.vy > 0) {
      this.collision.stopAtDownWall()
      this.coyoteTime = 0 // 着地したらコヨーテタイムリセット
    } else {
      // 空中にいる場合、コヨーテタイムを増やす
      this.coyoteTime++
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}
