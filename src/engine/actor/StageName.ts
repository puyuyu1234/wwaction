import { Container } from 'pixi.js'

import { RectActor } from './RectActor'
import { TextActor } from './TextActor'

import { easeOutExpo, easeLinear } from '@/utils/easing'

/**
 * ステージ名表示演出
 * 黒い矩形が左右から中央に向かって移動し、ステージ名テキストが文字ごとに遅延して表示される
 * legacy: stage.js:99-164
 */
export class StageName {
  private rect1: RectActor
  private rect2: RectActor
  private letters: Array<{ actor: TextActor; initialY: number }> = []

  // アニメーション定数（legacy実装に合わせる）
  private static readonly MOVE_TIME = 40
  private static readonly WAIT_TIME = 120
  private static readonly LETTER_DELAY = 2 // 文字ごとの遅延フレーム数

  constructor(stageName: string, stageEngName: string, viewportWidth = 320) {
    // 黒い矩形を作成（左右から中央へ）
    this.rect1 = new RectActor(viewportWidth, 90, viewportWidth, 30, '#0008')
    this.rect2 = new RectActor(-viewportWidth, 60, viewportWidth, 30, '#0008')

    // ステージ名テキストを作成（文字ごとに分割）
    this.createStageNameText(stageName, 102, 16, 2, viewportWidth)
    this.createStageNameText(stageEngName, 127, 12, 1, viewportWidth)
  }

  /**
   * ステージ名テキストを文字ごとに作成
   * legacy実装: stage.js:132-136
   */
  private createStageNameText(
    name: string,
    y: number,
    fontSize: number,
    letterSize: number,
    viewportWidth: number
  ): void {
    const centerX = viewportWidth / 2

    for (let i = 0; i < name.length; i++) {
      const x = ((i - name.length / 2) * fontSize * letterSize) / 2 + centerX
      const letter = new TextActor(name[i], x, y)
      letter.fontSize = fontSize
      letter.color = 'white'
      letter.alpha = 0
      // 初期Y座標を保存（アニメーション用）
      this.letters.push({ actor: letter, initialY: y })
    }
  }

  /**
   * 更新処理
   */
  update(): void {
    const time = this.rect1.time
    const moveTime = StageName.MOVE_TIME
    const waitTime = StageName.WAIT_TIME

    // 矩形のアニメーション
    if (time <= moveTime) {
      // 中央に向かって移動
      this.rect1.x = easeOutExpo(320, 0, time, moveTime)
      this.rect2.x = easeOutExpo(-320, 0, time, moveTime)
    } else if (time <= waitTime + moveTime) {
      // 待機
    } else if (time <= waitTime + moveTime * 2) {
      // 画面外へ移動（フェードアウト）
      const t = time - (waitTime + moveTime)
      this.rect1.x = easeOutExpo(0, -320, t, moveTime)
      this.rect2.x = easeOutExpo(0, 320, t, moveTime)
      this.rect1.alpha = easeOutExpo(1, 0, t, moveTime)
      this.rect2.alpha = easeOutExpo(1, 0, t, moveTime)
    }

    // 文字のアニメーション
    // legacy実装: stage.js:139-159
    this.letters.forEach((letterData, i) => {
      const letter = letterData.actor
      const y = letterData.initialY // 初期Y座標
      const y1 = y - 30 // 目標Y座標
      const delayTime = i * StageName.LETTER_DELAY

      if (delayTime <= time && time <= delayTime + moveTime) {
        // 下から上に移動しながらフェードイン
        const t = time - delayTime
        letter.y = easeOutExpo(y, y1, t, moveTime)
        letter.alpha = easeLinear(0, 1, t, moveTime)
      } else if (time <= delayTime + moveTime + waitTime) {
        // 待機
      } else if (time <= delayTime + moveTime + 2 * waitTime) {
        // フェードアウト
        const t = time - (delayTime + waitTime + moveTime)
        letter.y = easeOutExpo(y1, y1 - 15, t, moveTime)
        letter.alpha = easeOutExpo(1, 0, t, moveTime)
      }

      letter.update()
    })

    this.rect1.update()
    this.rect2.update()
  }

  /**
   * Containerに追加
   */
  addToContainer(container: Container, zIndex: number): void {
    this.rect1.graphics.zIndex = zIndex
    this.rect2.graphics.zIndex = zIndex
    container.addChild(this.rect1.graphics)
    container.addChild(this.rect2.graphics)

    this.letters.forEach((letterData) => {
      letterData.actor.text.zIndex = zIndex
      container.addChild(letterData.actor.text)
    })
  }

  /**
   * 破棄処理
   */
  destroy(): void {
    this.rect1.destroy()
    this.rect2.destroy()
    this.letters.forEach((letterData) => letterData.actor.destroy())
  }

  /**
   * アニメーションが完了したか
   */
  isFinished(): boolean {
    const time = this.rect1.time
    const moveTime = StageName.MOVE_TIME
    const waitTime = StageName.WAIT_TIME
    const maxLetterDelay = (this.letters.length - 1) * StageName.LETTER_DELAY
    return time > maxLetterDelay + moveTime + 2 * waitTime
  }
}
