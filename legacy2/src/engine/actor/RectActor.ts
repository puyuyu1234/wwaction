import { Graphics } from 'pixi.js'

import { Actor } from './Actor'

/**
 * 矩形描画アクター
 * 画面遷移演出やステージ名表示の背景に使用
 */
export class RectActor extends Actor {
  graphics: Graphics
  color: string
  alpha = 1
  rotate = 0 // 回転角度（度数法）

  constructor(x: number, y: number, width: number, height: number, color: string) {
    super(x, y)
    this.width = width
    this.height = height
    this.color = color
    this.graphics = new Graphics()
    this.render()
  }

  /**
   * 矩形を描画
   */
  render(): void {
    this.graphics.clear()

    // 色文字列をパース（#000, #000000, rgb(r,g,b) など）
    const colorValue = this.parseColor(this.color)

    this.graphics.rect(0, 0, this.width, this.height)
    this.graphics.fill({ color: colorValue, alpha: this.alpha })

    // 位置と回転を更新
    this.graphics.x = this.x
    this.graphics.y = this.y
    this.graphics.angle = this.rotate
  }

  /**
   * 更新時に描画を更新
   */
  update(): void {
    this.time++
    this.render()
  }

  /**
   * 色文字列を16進数に変換
   */
  private parseColor(color: string): number {
    // #000 形式（3桁）
    if (color.startsWith('#') && color.length === 4) {
      const r = parseInt(color[1] + color[1], 16)
      const g = parseInt(color[2] + color[2], 16)
      const b = parseInt(color[3] + color[3], 16)
      return (r << 16) | (g << 8) | b
    }

    // #000000 形式（6桁）
    if (color.startsWith('#') && color.length === 7) {
      return parseInt(color.slice(1), 16)
    }

    // #00000000 形式（8桁、アルファ付き）
    if (color.startsWith('#') && color.length === 9) {
      const rgb = parseInt(color.slice(1, 7), 16)
      const a = parseInt(color.slice(7, 9), 16) / 255
      this.alpha = a
      return rgb
    }

    // デフォルト（黒）
    return 0x000000
  }

  /**
   * 破棄処理
   */
  destroy(): void {
    this.graphics.destroy()
    this.dispatch('destroy')
  }
}
