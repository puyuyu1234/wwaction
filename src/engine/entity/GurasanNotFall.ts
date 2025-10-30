import { Gurasan } from './Gurasan'

/**
 * GurasanNotFall（落ちないグラサン）エンティティ
 * - Gurasan の亜種
 * - 崖で方向転換する（落ちない）
 */
export class GurasanNotFall extends Gurasan {
  constructor(x: number, y: number, stage: string[][]) {
    super(x, y, stage)
  }

  update() {
    // 親クラスの基本動作を実行（重力、壁反転、速度適用）
    // ただし、崖判定を追加する必要があるため、オーバーライド

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

      // 崖判定（接地している時のみ）- Nuefu と同じロジック
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
