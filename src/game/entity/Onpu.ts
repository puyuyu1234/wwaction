import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/** 生存時間（フレーム）：5秒 */
const LIFETIME = 180

/** フェードアウト開始時間（フレーム）：2秒 */
const FADE_START = 120

/** 座標の揺れ幅（px） */
const SHAKE_AMPLITUDE = 1

/**
 * 音符（Onpu）エンティティ
 * - セミが発射する弾
 * - 地形に干渉せず直進
 * - 一定時間で消滅
 */
export class Onpu extends Entity {
  private lifetime = LIFETIME
  private baseX = 0
  private baseY = 0

  constructor(centerX: number, centerY: number, vx: number, vy: number) {
    // hitbox: -1,-1,2,2（極小の当たり判定）
    const hitbox = new Rectangle(-1, -1, 2, 2)
    super('entity', centerX, centerY, 16, 16, hitbox, ['enemy'])

    this.baseX = centerX
    this.baseY = centerY
    this.vx = vx
    this.vy = vy

    this.playAnimation('onpu')
  }

  tick() {
    super.tick()

    // 基準座標を移動
    this.baseX += this.vx
    this.baseY += this.vy

    // 座標をランダムに揺らす
    this.x = this.baseX + (Math.random() - 0.5) * 2 * SHAKE_AMPLITUDE
    this.y = this.baseY + (Math.random() - 0.5) * 2 * SHAKE_AMPLITUDE

    // 生存時間チェック
    this.lifetime--

    // フェードアウト（4秒経過後から徐々に透明に）
    const elapsed = LIFETIME - this.lifetime
    if (elapsed >= FADE_START) {
      const fadeProgress = (elapsed - FADE_START) / (LIFETIME - FADE_START)
      this.alpha = 1 - fadeProgress
    }

    if (this.lifetime <= 0) {
      this.behavior.destroy()
    }
  }
}
