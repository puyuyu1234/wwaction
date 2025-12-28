import { Container } from 'pixi.js'

import { RectActor } from './RectActor'

import { easeInSine, easeOutSine } from '@ptre/utils/easing'

/**
 * シーン遷移演出
 * 斜めに傾いた黒矩形が左右から開閉するアニメーション
 */
export class SceneTransition {
  private rect1: RectActor
  private rect2: RectActor
  private isOpening: boolean // true = シーン開始（開く）, false = シーン終了（閉じる）
  private onCompleteCallback?: () => void

  // アニメーション定数
  private static readonly SIZE = 400
  private static readonly X = 160 - 400 / 2 // -40
  private static readonly Y = 120 - 400 / 2 // -80
  private static readonly START_DX = 200
  private static readonly DX = 390
  private static readonly MOVE_TIME = 10
  private static readonly DELAY_TIME = 10 // 閉じる時の遅延
  private static readonly ROTATION = -10 // 回転角度（度数法）

  constructor(isOpening: boolean) {
    this.isOpening = isOpening

    const size = SceneTransition.SIZE
    const x = SceneTransition.X
    const y = SceneTransition.Y
    const startDx = SceneTransition.START_DX
    const dx = SceneTransition.DX

    // 開く時: (x + startDx, y) から開始
    // 閉じる時: (x + dx, y) から開始
    const initialX1 = isOpening ? x + startDx : x + dx
    const initialX2 = isOpening ? x - startDx : x - dx

    this.rect1 = new RectActor(initialX1, y, size, size, '#000')
    this.rect2 = new RectActor(initialX2, y, size, size, '#000')
    this.rect1.rotate = SceneTransition.ROTATION
    this.rect2.rotate = SceneTransition.ROTATION
  }

  /**
   * アニメーション完了時のコールバックを設定
   */
  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback
  }

  /**
   * 更新処理
   */
  tick(): void {
    this.rect1.tick()
    this.rect2.tick()

    const time = this.rect1.time
    const moveTime = SceneTransition.MOVE_TIME
    const x = SceneTransition.X
    const startDx = SceneTransition.START_DX
    const dx = SceneTransition.DX
    const delayTime = SceneTransition.DELAY_TIME

    if (this.isOpening) {
      // シーン開始（開く）: easeInSine で画面内 → 画面外へ
      this.rect1.x = easeInSine(x + startDx, x + dx, time, moveTime)
      this.rect2.x = easeInSine(x - startDx, x - dx, time, moveTime)

      // 完了判定: time >= moveTime
      if (time >= moveTime && this.onCompleteCallback) {
        this.onCompleteCallback()
      }
    } else {
      // シーン終了（閉じる）: easeOutSine で画面外 → 画面内へ
      this.rect1.x = easeOutSine(x + dx, x + startDx, time, moveTime)
      this.rect2.x = easeOutSine(x - dx, x - startDx, time, moveTime)

      // 完了判定: time >= moveTime + delayTime
      if (time >= moveTime + delayTime && this.onCompleteCallback) {
        this.onCompleteCallback()
      }
    }
  }

  /**
   * Containerに追加
   */
  addToContainer(container: Container, zIndex: number): void {
    this.rect1.graphics.zIndex = zIndex
    this.rect2.graphics.zIndex = zIndex
    container.addChild(this.rect1.graphics)
    container.addChild(this.rect2.graphics)
  }

  /**
   * 破棄処理
   */
  destroy(): void {
    this.rect1.destroy()
    this.rect2.destroy()
  }

  /**
   * アニメーションが完了したか
   */
  isFinished(): boolean {
    const time = this.rect1.time
    const moveTime = SceneTransition.MOVE_TIME
    const delayTime = SceneTransition.DELAY_TIME
    return this.isOpening ? time >= moveTime : time >= moveTime + delayTime
  }
}
