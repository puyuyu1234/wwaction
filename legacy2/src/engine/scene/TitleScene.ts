import { GameSettings } from '@core/GameSettings'
import { Input } from '@core/Input'
import { Graphics, Text } from 'pixi.js'

import { Scene } from './Scene'

import { AudioManager } from '@/audio/AudioManager'
import { DIFFICULTY_NAMES, FONT } from '@/game/config'

/**
 * タイトルシーン
 * 難易度/音量設定 + ゲーム開始
 */
export class TitleScene extends Scene {
  private input: Input
  private settings = GameSettings.getInstance()
  private audio = AudioManager.getInstance()

  private titleText: Text
  private menuItems: Text[] = []
  private background: Graphics
  private viewportWidth: number
  private viewportHeight: number
  private onStartGame: (() => void) | null = null

  private selectedIndex = 0 // 0: 難易度, 1: BGM音量, 2: SE音量, 3: 開始

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
    this.titleText.y = 40
    this.titleText.roundPixels = true
    this.container.addChild(this.titleText)

    // メニュー項目生成
    this.createMenuItems()
  }

  /**
   * メニュー項目を生成
   */
  private createMenuItems() {
    const menuY = 100
    const menuSpacing = 24

    // 4つのメニュー項目（難易度/BGM/SE/開始）
    for (let i = 0; i < 4; i++) {
      const text = new Text({
        text: '',
        style: {
          fontFamily: FONT,
          fontSize: 14,
          fill: 0xaaaaaa,
        },
        resolution: 1,
      })
      text.anchor.set(0.5)
      text.x = this.viewportWidth / 2
      text.y = menuY + i * menuSpacing
      text.roundPixels = true
      this.container.addChild(text)
      this.menuItems.push(text)
    }

    this.updateMenuText()
    this.updateSelection()
  }

  /**
   * メニューテキストを更新
   */
  private updateMenuText() {
    const difficulty = DIFFICULTY_NAMES[this.settings.getDifficulty()]
    const bgmVolume = this.settings.getBgmVolume()
    const sfxVolume = this.settings.getSfxVolume()

    this.menuItems[0].text = `Difficulty: ${difficulty}`
    this.menuItems[1].text = `BGM Volume: ${bgmVolume} dB`
    this.menuItems[2].text = `SFX Volume: ${sfxVolume} dB`
    this.menuItems[3].text = 'Press SPACE to Start'
  }

  /**
   * 選択状態を更新（選択中の項目を黄色に）
   */
  private updateSelection() {
    this.menuItems.forEach((item, i) => {
      item.style.fill = i === this.selectedIndex ? 0xffff00 : 0xaaaaaa
    })
  }

  /**
   * ゲーム開始コールバックを設定
   */
  setOnStartGame(callback: () => void) {
    this.onStartGame = callback
  }

  update() {
    super.update()

    // W/Sキーで選択移動
    if (this.input.isKeyPressed('KeyW')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1)
      this.updateSelection()
    }
    if (this.input.isKeyPressed('KeyS')) {
      this.selectedIndex = Math.min(3, this.selectedIndex + 1)
      this.updateSelection()
    }

    // A/Dキーで値変更
    this.handleValueChange()

    // SPACEキーでゲーム開始（「Press SPACE to Start」選択時のみ）
    if (this.selectedIndex === 3 && this.input.isKeyPressed('Space')) {
      if (this.onStartGame) {
        this.onStartGame()
      }
    }
  }

  /**
   * 値変更処理（A/Dキー）
   */
  private handleValueChange() {
    // 難易度変更
    if (this.selectedIndex === 0) {
      if (this.input.isKeyPressed('KeyD')) {
        const current = this.settings.getDifficulty()
        this.settings.setDifficulty(Math.min(3, current + 1))
        this.updateMenuText()
      }
      if (this.input.isKeyPressed('KeyA')) {
        const current = this.settings.getDifficulty()
        this.settings.setDifficulty(Math.max(0, current - 1))
        this.updateMenuText()
      }
    }

    // BGM音量変更（3dB刻み）
    if (this.selectedIndex === 1) {
      if (this.input.isKeyPressed('KeyD')) {
        const current = this.settings.getBgmVolume()
        const newVolume = Math.min(0, current + 3)
        this.settings.setBgmVolume(newVolume)
        this.audio.setMusicVolume(newVolume)
        this.updateMenuText()
      }
      if (this.input.isKeyPressed('KeyA')) {
        const current = this.settings.getBgmVolume()
        const newVolume = Math.max(-60, current - 3)
        this.settings.setBgmVolume(newVolume)
        this.audio.setMusicVolume(newVolume)
        this.updateMenuText()
      }
    }

    // SE音量変更（3dB刻み）
    if (this.selectedIndex === 2) {
      if (this.input.isKeyPressed('KeyD')) {
        const current = this.settings.getSfxVolume()
        const newVolume = Math.min(0, current + 3)
        this.settings.setSfxVolume(newVolume)
        this.audio.setSoundVolume(newVolume)
        this.updateMenuText()
      }
      if (this.input.isKeyPressed('KeyA')) {
        const current = this.settings.getSfxVolume()
        const newVolume = Math.max(-60, current - 3)
        this.settings.setSfxVolume(newVolume)
        this.audio.setSoundVolume(newVolume)
        this.updateMenuText()
      }
    }
  }
}
