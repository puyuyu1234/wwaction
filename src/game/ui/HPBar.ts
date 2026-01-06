import { FONT } from '@game/config'
import { AssetLoader } from '@ptre/core/AssetLoader'
import { Container, Graphics, Sprite, Text } from 'pixi.js'

/**
 * HP取得インターフェース
 * HPBarはこのインターフェースを満たすオブジェクトからHPを取得する
 */
export interface IHPProvider {
  hp: number
  maxHp: number
}

/**
 * HPバー表示クラス
 * - 数値表示 (HP/最大HP)
 * - ゲージバー（緑バー + 赤バー）
 * - ダメージ時：緑バーは即座に減少、赤バーはゆっくり減少
 * - 回復時：緑バーはゆっくり増加
 */
export class HPBar {
  public container: Container
  private hpProvider: IHPProvider

  private readonly BAR_WIDTH = 100
  private readonly BAR_HEIGHT = 8
  private readonly BAR_FRAME = 3 // 画像の枠の厚さ
  private readonly FONT_SIZE = 10
  private readonly HP_LETTER_SIZE = this.FONT_SIZE * 1.5 + 3

  private hpText: Text
  private hpTextOutlines: Text[] = []
  private bgSprite: Sprite
  private redBarGraphics: Graphics
  private greenBarGraphics: Graphics

  private redBarWidth = 0
  private greenBarWidth = 0
  private damageWaitTime = 0
  private redBarDecreaseRate = 0

  constructor(hpProvider: IHPProvider, x = 10, y = 220) {
    this.hpProvider = hpProvider
    this.container = new Container()
    this.container.x = x
    this.container.y = y

    // 背景画像（ui.png: 108x16）
    const uiTexture = AssetLoader.getInstance().getTexture('ui')
    this.bgSprite = new Sprite(uiTexture)
    this.bgSprite.x = 18
    this.container.addChild(this.bgSprite)

    // HP数値テキスト（ピクセルパーフェクトな縁取り）
    // 4方向に黒テキストを配置してアウトラインを作成
    const textStyle = {
      fontFamily: FONT,
      fontSize: this.FONT_SIZE,
      fill: 0x222222,
    }
    const offsets = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ]
    for (const offset of offsets) {
      const outline = new Text({ text: '', style: { ...textStyle } })
      outline.x = 2 + offset.x
      outline.y = 2 + offset.y
      this.hpTextOutlines.push(outline)
      this.container.addChild(outline)
    }

    // メインテキスト（白）
    this.hpText = new Text({
      text: '',
      style: {
        fontFamily: FONT,
        fontSize: this.FONT_SIZE,
        fill: 0xffffff,
      },
    })
    this.hpText.x = 2
    this.hpText.y = 2
    this.container.addChild(this.hpText)

    // 赤バー（遅延HP）
    this.redBarGraphics = new Graphics()
    this.container.addChild(this.redBarGraphics)

    // 緑バー（現在HP）
    this.greenBarGraphics = new Graphics()
    this.container.addChild(this.greenBarGraphics)

    // 初期値 - 現在のHPに合わせて初期化
    const initialBarWidth = this.calculateBarWidth(hpProvider.hp, hpProvider.maxHp)
    this.redBarWidth = initialBarWidth
    this.greenBarWidth = initialBarWidth
  }

  /**
   * HPからバー幅を計算
   */
  private calculateBarWidth(hp: number, maxHp: number): number {
    return hp < maxHp ? Math.floor((this.BAR_WIDTH * hp) / maxHp) : this.BAR_WIDTH
  }

  /**
   * 毎フレーム更新
   */
  tick() {
    // HP数値テキスト更新
    this.updateHPText()

    // ゲージバー更新
    this.updateBars()
  }

  /**
   * HP数値テキストの更新
   */
  private updateHPText() {
    const hp = this.hpProvider.hp
    const maxHp = this.hpProvider.maxHp

    // 10以上の場合は「*」で表示
    const text = hp >= 10 ? `*/${maxHp}` : `${hp}/${maxHp}`
    this.hpText.text = text

    // アウトラインテキストも同じ内容に更新
    for (const outline of this.hpTextOutlines) {
      outline.text = text
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
    // 現在HPに対応するバーの幅を計算
    const currentBarSize = this.calculateBarWidth(this.hpProvider.hp, this.hpProvider.maxHp)

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
      const radius = 2
      this.redBarGraphics.roundRect(barX, barY, this.redBarWidth, this.BAR_HEIGHT, radius)
      this.redBarGraphics.fill(0xff0000)
    }

    // 緑バー描画
    this.greenBarGraphics.clear()
    if (this.greenBarWidth > 0) {
      const radius = 2
      this.greenBarGraphics.roundRect(barX, barY, this.greenBarWidth, this.BAR_HEIGHT, radius)
      this.greenBarGraphics.fill(0x00ff00)
      // 光沢ライン（上端に白い薄い線）
      this.greenBarGraphics.roundRect(barX + 1, barY + 1, this.greenBarWidth - 3, 2, 1)
      this.greenBarGraphics.fill({ color: 0xffffff, alpha: 0.7 })
    }
  }

  /**
   * ダメージを受けた時の処理
   * @param _damage ダメージ量（現在は未使用だがインターフェース互換のため保持）
   */
  onDamage(_damage: number) {
    const currentBarSize = Math.floor((this.BAR_WIDTH * this.hpProvider.hp) / this.hpProvider.maxHp)
    this.damageWaitTime = 10
    this.redBarDecreaseRate = (this.redBarWidth - currentBarSize) / 15
  }

  /**
   * 破棄処理
   */
  destroy() {
    this.container.destroy({ children: true })
  }
}
