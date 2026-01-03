import { FONT } from '@game/config'
import { EventDispatcher } from '@ptre/core/EventDispatcher'
import { Text, TextStyle } from 'pixi.js'

/**
 * テキスト描画アクター（UI用）
 * ステージ名表示などに使用
 * シンプルな実装で、フレームカウント付き
 */
export class TextActor extends EventDispatcher {
  text: Text
  x: number
  y: number
  alpha = 1
  color = 'white'
  fontSize = 16
  textAlign: 'left' | 'center' | 'right' = 'left'
  textBaseline: 'top' | 'middle' | 'bottom' = 'top'
  time = 0 // 経過フレーム数

  constructor(content: string, x: number, y: number) {
    super()
    this.x = x
    this.y = y

    const style = new TextStyle({
      fontFamily: FONT,
      fontSize: this.fontSize,
      fill: this.color,
      align: this.textAlign,
    })

    this.text = new Text({ text: content, style, resolution: 1 })
    this.text.roundPixels = true
    this.updatePosition()
  }

  /**
   * 位置とスタイルを更新
   */
  private updatePosition(): void {
    this.text.x = this.x
    this.text.y = this.y
    this.text.alpha = this.alpha

    // textAlign と textBaseline に応じてアンカーを設定
    const anchorX = this.textAlign === 'center' ? 0.5 : this.textAlign === 'right' ? 1 : 0
    const anchorY = this.textBaseline === 'middle' ? 0.5 : this.textBaseline === 'bottom' ? 1 : 0
    this.text.anchor.set(anchorX, anchorY)

    // フォントサイズと色を更新
    this.text.style.fontSize = this.fontSize
    this.text.style.fill = this.color
  }

  /**
   * 更新時に位置を更新
   */
  tick(): void {
    this.time++
    this.updatePosition()
  }

  /**
   * 破棄処理
   */
  destroy(): void {
    this.text.destroy()
    this.dispatch('destroy', {})
  }
}
