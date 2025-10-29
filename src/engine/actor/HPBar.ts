
import { Player } from '@entity/Player'
import { FONT } from '@game/config'
import { Container, Graphics, Text } from 'pixi.js'

/**
 * HPバー表示クラス
 * - 数値表示 (HP/最大HP)
 * - ゲージバー（緑バー + 赤バー）
 * - ダメージ時：緑バーは即座に減少、赤バーはゆっくり減少
 * - 回復時：緑バーはゆっくり増加
 */
export class HPBar {
  public container: Container
  private player: Player

  private readonly BAR_WIDTH = 100
  private readonly BAR_HEIGHT = 8
  private readonly BAR_FRAME = 1
  private readonly FONT_SIZE = 10
  private readonly HP_LETTER_SIZE = this.FONT_SIZE * 1.5 + 3

  private hpText: Text
  private bgGraphics: Graphics
  private redBarGraphics: Graphics
  private greenBarGraphics: Graphics

  private redBarWidth = 0
  private greenBarWidth = 0
  private damageWaitTime = 0
  private redBarDecreaseRate = 0

  constructor(player: Player, x = 10, y = 220) {
    this.player = player
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // 背景（黒）
    this.bgGraphics = new Graphics()
    this.bgGraphics.rect(
      0,
      0,
      this.BAR_WIDTH + 2 * this.BAR_FRAME + this.HP_LETTER_SIZE,
      this.BAR_HEIGHT + 2 * this.BAR_FRAME
    )
    this.bgGraphics.fill(0x000000)
    this.container.addChild(this.bgGraphics)

    // HP数値テキスト
    this.hpText = new Text({
      text: '',
      style: {
        fontFamily: FONT,
        fontSize: this.FONT_SIZE,
        fill: 0xffffff,
      },
    })
    this.hpText.x = 2
    this.hpText.y = 0
    this.container.addChild(this.hpText)

    // 赤バー（遅延HP）
    this.redBarGraphics = new Graphics()
    this.container.addChild(this.redBarGraphics)

    // 緑バー（現在HP）
    this.greenBarGraphics = new Graphics()
    this.container.addChild(this.greenBarGraphics)

    // 初期値
    this.redBarWidth = this.BAR_WIDTH
    this.greenBarWidth = this.BAR_WIDTH
  }

  /**
   * 毎フレーム更新
   */
  update() {
    // HP数値テキスト更新
    this.updateHPText()

    // ゲージバー更新
    this.updateBars()
  }

  /**
   * HP数値テキストの更新
   */
  private updateHPText() {
    const hp = this.player.hp
    const maxHp = this.player.maxHp

    // 10以上の場合は「*」で表示
    if (hp >= 10) {
      this.hpText.text = `*/${maxHp}`
    } else {
      this.hpText.text = `${hp}/${maxHp}`
    }

    // 色の変化
    if (hp === 0) {
      this.hpText.style.fill = 0xff0000 // 赤
    } else if (hp < maxHp) {
      this.hpText.style.fill = 0xffff00 // 黄色
    } else if (hp === maxHp) {
      this.hpText.style.fill = 0xffffff // 白
    } else {
      this.hpText.style.fill = 0x00ff00 // 緑（超過時）
    }
  }

  /**
   * ゲージバーの更新
   */
  private updateBars() {
    const hp = this.player.hp
    const maxHp = this.player.maxHp

    // 現在HPに対応するバーの幅を計算
    const currentBarSize = hp < maxHp ? Math.floor((this.BAR_WIDTH * hp) / maxHp) : this.BAR_WIDTH

    // 緑バーの更新
    if (currentBarSize <= this.greenBarWidth) {
      // ダメージ時：即座に減少
      this.greenBarWidth = currentBarSize
    } else {
      // 回復時：ゆっくり増加
      this.greenBarWidth++
    }

    // 赤バーの更新
    if (this.greenBarWidth < this.redBarWidth) {
      // ダメージ時：ゆっくり減少
      if (this.damageWaitTime-- <= 0) {
        this.redBarWidth -= this.redBarDecreaseRate
        this.redBarWidth = Math.max(0, this.redBarWidth)
      }
    } else {
      // 通常時：緑バーに追従
      this.redBarWidth = this.greenBarWidth
    }

    // 描画更新
    this.renderBars()
  }

  /**
   * バーの描画
   */
  private renderBars() {
    const barX = this.HP_LETTER_SIZE + this.BAR_FRAME
    const barY = this.BAR_FRAME

    // 赤バー描画
    this.redBarGraphics.clear()
    if (this.redBarWidth > 0) {
      this.redBarGraphics.rect(barX, barY, this.redBarWidth, this.BAR_HEIGHT)
      this.redBarGraphics.fill(0xff0000)
    }

    // 緑バー描画
    this.greenBarGraphics.clear()
    if (this.greenBarWidth > 0) {
      this.greenBarGraphics.rect(barX, barY, this.greenBarWidth, this.BAR_HEIGHT)
      this.greenBarGraphics.fill(0x00ff00)
    }
  }

  /**
   * ダメージを受けた時の処理
   * @param _damage ダメージ量（現在は未使用だがインターフェース互換のため保持）
   */
  onDamage(_damage: number) {
    const currentBarSize = Math.floor((this.BAR_WIDTH * this.player.hp) / this.player.maxHp)
    this.damageWaitTime = 10
    this.redBarDecreaseRate = (this.redBarWidth - currentBarSize) / 15
  }
}
