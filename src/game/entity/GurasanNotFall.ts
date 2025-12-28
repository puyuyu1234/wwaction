import { CommonBehaviors } from './commonBehaviors'
import { Gurasan } from './Gurasan'

/**
 * GurasanNotFall（落ちないグラサン）エンティティ
 * - Gurasan の亜種
 * - 崖で方向転換する（落ちない）
 */
export class GurasanNotFall extends Gurasan {
  constructor(centerX: number, centerY: number, stage: string[][]) {
    super(centerX, centerY, stage)
  }

  tick() {
    // AnimatedSpriteActorのtick()を呼ぶ（強制アニメーションカウンタ更新）
    // super.tick()はGurasanのtick()を呼んでしまうのでスキップ
    if (this.isDestroyed) return
    if (this.animationStopFrame > 0) {
      this.animationStopFrame--
    }

    this.physics.applyGravity()

    // 横壁: 反転
    CommonBehaviors.bounceHorizontalWalls(this, this.tilemap)

    // 縦壁: 停止＋崖検知
    CommonBehaviors.stopVerticalWallsWithCliffDetection(this, this.tilemap)

    this.physics.applyVelocity()
  }
}
