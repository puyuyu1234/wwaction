import type { Input } from '../core/Input'

import { AnimatedSpriteActor } from './AnimatedSpriteActor'

import { UI_TYPE_DATA } from '@/game/config'

/**
 * UI用スプライト（キー操作ガイドなど）
 *
 * 使用例：
 * ```
 * const input = new Input()
 * new UISprite('w', 224, 112, input) // Wキー表示
 * new UISprite(' ', 432, 112, input) // スペースキー表示
 * ```
 */
export class UISprite extends AnimatedSpriteActor {
  /** UIタイプ（キー文字） */
  readonly type: string

  /** 入力管理クラス */
  private input: Input

  constructor(type: string, x: number, y: number, input: Input) {
    const uiType = UI_TYPE_DATA[type]

    if (!uiType) {
      throw new Error(`Unknown UI type: ${type}`)
    }

    super(uiType.imageKey, x, y, uiType.width, uiType.height)
    this.type = type
    this.input = input

    // 初期アニメーションを設定
    this.playAnimation(uiType.animationKey)
  }

  /**
   * ゲームロジック更新
   * キーの押下状態に応じてアニメーションを切り替える
   */
  tick(): void {
    if (this.isDestroyed) return

    super.tick()

    const uiType = UI_TYPE_DATA[this.type]

    // キー押下時のアニメーションが定義されている場合のみ切り替え
    if (uiType.pushedAnimationKey && uiType.keyCode) {
      const keyPressed = this.input.getKey(uiType.keyCode) > 0

      if (keyPressed) {
        this.playAnimation(uiType.pushedAnimationKey)
      } else {
        this.playAnimation(uiType.animationKey)
      }
    }
  }
}
