import { Input } from '@core/Input'
import { Graphics, Text } from 'pixi.js'

import { Scene } from './Scene'

import { FONT } from '@/game/config'

/**
 * タイトルシーン
 * キー入力でStageSceneに遷移
 */
export class TitleScene extends Scene {
  private input: Input
  private titleText: Text
  private instructionText: Text
  private background: Graphics
  private viewportWidth: number
  private viewportHeight: number
  private onStartGame: (() => void) | null = null

  constructor(input: Input, viewportWidth = 320, viewportHeight = 240) {
    super()
    this.input = input
    this.viewportWidth = viewportWidth
    this.viewportHeight = viewportHeight

    // 背景
    this.background = new Graphics()
    this.background.rect(0, 0, this.viewportWidth, this.viewportHeight)
    this.background.fill(0x000000)
    this.container.addChild(this.background)

    // タイトルテキスト
    this.titleText = new Text({
      text: 'WWAction',
      style: {
        fontFamily: FONT,
        fontSize: 32,
        fill: 0xffffff,
      },
      resolution: 1,
    })
    this.titleText.anchor.set(0.5)
    this.titleText.x = this.viewportWidth / 2
    this.titleText.y = this.viewportHeight / 3
    this.titleText.roundPixels = true
    this.container.addChild(this.titleText)

    // 操作説明テキスト
    this.instructionText = new Text({
      text: 'Press any key to start',
      style: {
        fontFamily: FONT,
        fontSize: 12,
        fill: 0xaaaaaa,
      },
      resolution: 1,
    })
    this.instructionText.anchor.set(0.5)
    this.instructionText.x = this.viewportWidth / 2
    this.instructionText.y = (this.viewportHeight * 2) / 3
    this.instructionText.roundPixels = true
    this.container.addChild(this.instructionText)
  }

  /**
   * ゲーム開始コールバックを設定
   */
  setOnStartGame(callback: () => void) {
    this.onStartGame = callback
  }

  update() {
    super.update()

    // 何かキーが押されたらゲーム開始
    const pressedKeys = this.input.getPressedKeys()
    if (pressedKeys.length > 0 && this.onStartGame) {
      this.onStartGame()
    }
  }
}
