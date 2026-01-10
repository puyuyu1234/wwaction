import { Graphics } from 'pixi.js'

/**
 * 衝撃波エフェクト
 * 中心から広がる円、フェードアウトして消える
 */
export class ShockwaveEffect {
  readonly graphics: Graphics
  private centerX: number
  private centerY: number
  private radius = 0
  private alpha = 1
  private _isFinished = false

  /** 拡大速度 */
  private static readonly EXPAND_SPEED = 8
  /** 最大半径 */
  private static readonly MAX_RADIUS = 80
  /** フェード速度 */
  private static readonly FADE_SPEED = 0.08
  /** 線の太さ */
  private static readonly LINE_WIDTH = 3
  /** 色 */
  private static readonly COLOR = 0xffffff

  constructor(x: number, y: number) {
    this.centerX = x
    this.centerY = y
    this.graphics = new Graphics()
    this.draw()
  }

  private draw() {
    this.graphics.clear()
    if (this.alpha <= 0) return

    this.graphics.circle(this.centerX, this.centerY, this.radius)
    this.graphics.stroke({
      color: ShockwaveEffect.COLOR,
      width: ShockwaveEffect.LINE_WIDTH,
      alpha: this.alpha,
    })
  }

  tick() {
    if (this._isFinished) return

    // 拡大
    this.radius += ShockwaveEffect.EXPAND_SPEED

    // フェードアウト
    this.alpha -= ShockwaveEffect.FADE_SPEED

    // 終了判定
    if (this.radius >= ShockwaveEffect.MAX_RADIUS || this.alpha <= 0) {
      this._isFinished = true
      this.alpha = 0
    }

    this.draw()
  }

  isFinished(): boolean {
    return this._isFinished
  }

  destroy() {
    this.graphics.destroy()
  }
}
