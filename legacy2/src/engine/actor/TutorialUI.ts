import type { Input } from '@core/Input'
import type { Container } from 'pixi.js'

import { Actor } from './Actor'
import { UISprite } from './UISprite'

/**
 * チュートリアルUI表示コンポーネント
 * legacy の StageScene のチュートリアル特殊処理に対応
 *
 * 使用例：
 * ```
 * const tutorialUI = new TutorialUI(input)
 * tutorialUI.update()
 * tutorialUI.render(container)
 * ```
 */
export class TutorialUI extends Actor {
  private sprites: UISprite[] = []

  constructor(input: Input) {
    super(0, 0) // TutorialUI自体は座標を持たない

    // legacy/scene/stage.js:29-38 の配置を再現
    // UISpriteはアンカーポイントが中央(0.5, 0.5)なので、
    // 左上基準の座標に対して(width/2, height/2)を加算して中央座標に変換
    // 16x16のキー: +8, +8
    // 48x16のスペース: +24, +8
    this.sprites = [
      new UISprite('a', 16 + 8, 96 + 8, input),
      new UISprite('d', 64 + 8, 96 + 8, input),
      new UISprite('w', 224 + 8, 112 + 8, input),
      new UISprite(' ', 432 + 24, 112 + 8, input),
      new UISprite(' ', 64 + 656 + 24, 80 + 8, input),
      new UISprite('+', 64 + 672 + 8, 96 + 8, input),
      new UISprite(' ', 64 + 656 + 24, 112 + 8, input),
      new UISprite('s', 64 + 848 + 8, 80 + 8, input),
      new UISprite('+', 64 + 848 + 8, 96 + 8, input),
      new UISprite(' ', 64 + 832 + 24, 112 + 8, input),
    ]
  }

  /**
   * 更新処理
   * 全てのUIスプライトを更新
   */
  update() {
    this.sprites.forEach((sprite) => sprite.update())
  }

  /**
   * 描画処理
   * 全てのUIスプライトを描画
   * @param container 描画先のPixiJSコンテナ
   * @param zIndex z-index値（描画順制御用）
   */
  render(container: Container, zIndex?: number) {
    this.sprites.forEach((sprite) => sprite.render(container, zIndex))
  }
}
