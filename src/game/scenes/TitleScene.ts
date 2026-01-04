import { FONT, HPDATA, SCREEN } from '@game/config'
import { GameSession } from '@game/GameSession'
import { STAGEDATA } from '@game/stages'
import { Input } from '@ptre/core/Input'
import { Scene } from '@ptre/scene/Scene'
import { Text, Graphics } from 'pixi.js'

import { StageScene } from './StageScene'

/** 難易度名 */
const DIFFICULTY_NAMES = ['EASY', 'NORMAL', 'HARD', 'LUNATIC']

/** メニュー項目 */
const MENU_ITEMS = ['difficulty', 'stage'] as const
type MenuItem = (typeof MENU_ITEMS)[number]

/** 長押しリピート開始までの遅延（フレーム） */
const REPEAT_DELAY = 20

/** 長押しリピート間隔（フレーム） */
const REPEAT_INTERVAL = 5

/**
 * タイトルシーン（デバッグ用）
 * - 難易度選択
 * - 開始ステージ選択
 * - ゲーム開始
 */
export class TitleScene extends Scene {
  private input: Input
  private selectedIndex = 0
  private difficulty = 1 // NORMAL
  private startStage = 0

  private titleText!: Text
  private difficultyText!: Text
  private stageText!: Text
  private cursorGraphics!: Graphics

  private keyState = {
    up: false,
    down: false,
    space: false,
  }

  constructor(input: Input) {
    super()
    this.input = input

    this.setupUI()
  }

  private setupUI() {
    const centerX = SCREEN.WIDTH / 2

    // 背景（黒）
    const bg = new Graphics()
    bg.rect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT)
    bg.fill(0x000000)
    this.container.addChild(bg)

    // タイトル
    this.titleText = new Text({
      text: 'DEBUG MODE',
      style: {
        fontFamily: FONT,
        fontSize: 16,
        fill: 0xffffff,
      },
    })
    this.titleText.anchor.set(0.5, 0)
    this.titleText.x = centerX
    this.titleText.y = 40
    this.container.addChild(this.titleText)

    // 難易度
    this.difficultyText = new Text({
      text: '',
      style: {
        fontFamily: FONT,
        fontSize: 12,
        fill: 0xffffff,
      },
    })
    this.difficultyText.anchor.set(0.5, 0)
    this.difficultyText.x = centerX
    this.difficultyText.y = 100
    this.container.addChild(this.difficultyText)

    // ステージ
    this.stageText = new Text({
      text: '',
      style: {
        fontFamily: FONT,
        fontSize: 12,
        fill: 0xffffff,
      },
    })
    this.stageText.anchor.set(0.5, 0)
    this.stageText.x = centerX
    this.stageText.y = 130
    this.container.addChild(this.stageText)

    // カーソル
    this.cursorGraphics = new Graphics()
    this.container.addChild(this.cursorGraphics)

    // 操作説明
    const helpText = new Text({
      text: '[W/S] Select  [A/D] Change  [SPACE] Start',
      style: {
        fontFamily: FONT,
        fontSize: 10,
        fill: 0x888888,
      },
    })
    helpText.anchor.set(0.5, 0)
    helpText.x = centerX
    helpText.y = 170
    this.container.addChild(helpText)

    this.updateDisplay()
  }

  private updateDisplay() {
    const maxStage = STAGEDATA.length - 1
    const hp = HPDATA[this.difficulty]

    this.difficultyText.text = `< ${DIFFICULTY_NAMES[this.difficulty]} (HP:${hp}) >`
    this.stageText.text = `< STAGE ${this.startStage} / ${maxStage} >`

    // カーソル描画
    this.cursorGraphics.clear()
    const cursorY = this.getMenuY(MENU_ITEMS[this.selectedIndex])
    this.cursorGraphics.circle(60, cursorY + 6, 4)
    this.cursorGraphics.fill(0xffff00)
  }

  private getMenuY(item: MenuItem): number {
    switch (item) {
      case 'difficulty':
        return 100
      case 'stage':
        return 130
    }
  }

  private handleInput() {
    const up = this.input.isKeyDown('KeyW')
    const down = this.input.isKeyDown('KeyS')
    const leftTime = this.input.getKey('KeyA')
    const rightTime = this.input.getKey('KeyD')
    const space = this.input.isKeyDown('Space')

    // 上（単発のみ）
    if (up && !this.keyState.up) {
      this.selectedIndex = (this.selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length
      this.updateDisplay()
    }

    // 下（単発のみ）
    if (down && !this.keyState.down) {
      this.selectedIndex = (this.selectedIndex + 1) % MENU_ITEMS.length
      this.updateDisplay()
    }

    const currentItem = MENU_ITEMS[this.selectedIndex]

    // 左（単発 or リピート）
    if (this.shouldTrigger(leftTime)) {
      this.changeValue(-1, currentItem)
    }

    // 右（単発 or リピート）
    if (this.shouldTrigger(rightTime)) {
      this.changeValue(1, currentItem)
    }

    // スペース（開始）
    if (space && !this.keyState.space) {
      this.startGame()
    }

    // キー状態を更新
    this.keyState = { up, down, space }
  }

  /**
   * キーのトリガー判定（単発 or 長押しリピート）
   */
  private shouldTrigger(keyTime: number): boolean {
    if (keyTime <= 0) return false

    // 押した瞬間
    if (keyTime === 1) return true

    // 長押しリピート
    if (keyTime >= REPEAT_DELAY) {
      const elapsed = keyTime - REPEAT_DELAY
      if (elapsed % REPEAT_INTERVAL === 0) {
        return true
      }
    }

    return false
  }

  /**
   * 値を変更（ループ対応）
   */
  private changeValue(delta: number, item: MenuItem) {
    if (item === 'difficulty') {
      this.difficulty += delta
      if (this.difficulty < 0) this.difficulty = HPDATA.length - 1
      if (this.difficulty >= HPDATA.length) this.difficulty = 0
      this.updateDisplay()
    } else if (item === 'stage') {
      this.startStage += delta
      if (this.startStage < 0) this.startStage = STAGEDATA.length - 1
      if (this.startStage >= STAGEDATA.length) this.startStage = 0
      this.updateDisplay()
    }
  }

  private startGame() {
    const session = new GameSession(this.difficulty, this.startStage)
    const scene = new StageScene(
      session,
      this.input,
      SCREEN.WIDTH,
      SCREEN.HEIGHT,
      false
    )
    this.changeScene(scene)
  }

  tick() {
    super.tick()
    this.handleInput()
  }
}
