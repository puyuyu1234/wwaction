import type { Input } from '../core/Input'

import { ContainerActor } from './ContainerActor'
import { UISprite } from './UISprite'

/**
 * チュートリアルUI表示コンポーネント
 * ステージ1のチュートリアル用キー操作ガイドを表示
 *
 * 使用例：
 * ```
 * const tutorialUI = new TutorialUI(input)
 * container.addChild(tutorialUI)
 * // 毎フレーム
 * tutorialUI.tick()
 * ```
 */
export class TutorialUI extends ContainerActor {
  constructor(input: Input) {
    super(0, 0)

    // legacy/scene/stage.js:29-38 の配置を再現
    // UISpriteはアンカーポイントが中央(0.5, 0.5)なので、
    // 左上基準の座標に対して(width/2, height/2)を加算して中央座標に変換
    // 16x16のキー: +8, +8
    // 48x16のスペース: +24, +8
    const sprites = [
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

    for (const sprite of sprites) {
      this.addActor(sprite)
    }
  }
}
