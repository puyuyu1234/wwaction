import { Text, TextStyle } from 'pixi.js'

import { ActorBehavior } from './ActorBehavior'

/**
 * テキスト描画アクター
 * - PixiJS の Text を直接継承
 * - 汎用的なテキスト表示に使用
 * - アンカーポイントはデフォルトで中央(0.5, 0.5)、必要に応じて左上(0, 0)などに変更可能
 */
export class TextActor extends Text {
  readonly behavior: ActorBehavior

  /**
   * @param text 表示するテキスト
   * @param x アンカーポイント基準のX座標
   * @param y アンカーポイント基準のY座標
   * @param tags タグ配列
   * @param anchorX アンカーポイントX（0=左端, 0.5=中央, 1=右端）デフォルト: 0.5
   * @param anchorY アンカーポイントY（0=上端, 0.5=中央, 1=下端）デフォルト: 0.5
   * @param style TextStyleオブジェクト（フォント、色、サイズなど）省略時はPixiJSのデフォルト
   */
  constructor(
    text: string,
    x: number,
    y: number,
    tags: string[] = [],
    anchorX = 0.5,
    anchorY = 0.5,
    style?: Partial<TextStyle>
  ) {
    super({ text, style })

    this.x = x
    this.y = y
    this.behavior = new ActorBehavior(tags)

    // アンカーポイントを設定
    this.anchor.set(anchorX, anchorY)

    // ピクセルパーフェクトレンダリング
    this.roundPixels = true
  }

  /**
   * タグを持っているか確認
   */
  hasTag(tag: string): boolean {
    return this.behavior.hasTag(tag)
  }

  /**
   * 破壊されているかどうか
   */
  get isDestroyed(): boolean {
    return this.behavior.isDestroyed
  }

  /**
   * ゲームロジック更新（毎フレーム呼ばれる）
   */
  tick(): void {
    if (this.isDestroyed) return
    // 特に処理なし（必要に応じてオーバーライド）
  }

  /**
   * Actorを破壊
   */
  destroy(): void {
    this.behavior.destroy()
    super.destroy()
  }
}
