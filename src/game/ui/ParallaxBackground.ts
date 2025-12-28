import { AssetLoader } from '@ptre/core/AssetLoader'
import { BLOCKDATA, BLOCKSIZE } from '@game/config'
import { TilingSprite, Texture, RenderTexture, Container, Sprite } from 'pixi.js'

/**
 * 視差スクロール背景レイヤー
 * - PixiJSのTilingSpriteを使用した高速な無限リピート背景
 * - カメラ追従レートで視差効果を実現
 * - GPU Shaderでパターンリピート処理
 * - 複数文字のパターン（2x2など）に対応
 */
export class ParallaxBackground {
  private tilingSprite: TilingSprite
  private parallaxRateX: number
  private parallaxRateY: number

  /**
   * @param bgPattern 背景パターン配列（例：['y'] または ['yz', 'ab']）
   * @param width 背景の描画幅（ステージ幅を指定）
   * @param height 背景の描画高さ（ステージ高さを指定）
   * @param parallaxRateX X軸のカメラ追従レート（0.5 = カメラの半分の速度でスクロール）
   * @param parallaxRateY Y軸のカメラ追従レート（1.0 = カメラと同じ速度）
   */
  constructor(
    bgPattern: string[],
    width: number,
    height: number,
    parallaxRateX = 0.5,
    parallaxRateY = 1.0
  ) {
    this.parallaxRateX = parallaxRateX
    this.parallaxRateY = parallaxRateY

    // 背景パターンのグリッドサイズを計算
    const gridHeight = bgPattern.length
    const gridWidth = gridHeight > 0 ? Math.max(...bgPattern.map((row) => row.length)) : 1

    // 背景パターン全体を1つのテクスチャに合成
    const texture = this.createPatternTexture(bgPattern, gridWidth, gridHeight)

    // TilingSpriteを作成（無限リピート背景）
    this.tilingSprite = new TilingSprite({
      texture,
      width,
      height,
    })

    // タイルサイズは16x16で固定（BLOCKSIZEに合わせる）
    this.tilingSprite.tileScale.set(1, 1)
  }

  /**
   * 背景パターン全体を1つのテクスチャに合成
   * @param bgPattern 背景パターン配列（例：['y'] または ['yz', 'ab']）
   * @param gridWidth パターンの横幅（文字数）
   * @param gridHeight パターンの縦幅（行数）
   */
  private createPatternTexture(
    bgPattern: string[],
    gridWidth: number,
    gridHeight: number
  ): Texture {
    const loader = AssetLoader.getInstance()
    const spritesheet = loader.getSpritesheet('tileset')
    const renderer = loader.getRenderer()

    if (!spritesheet || !renderer) {
      console.warn('[ParallaxBackground] Tileset or renderer not available, using fallback')
      return Texture.EMPTY
    }

    // パターン全体のサイズ
    const patternWidth = gridWidth * BLOCKSIZE
    const patternHeight = gridHeight * BLOCKSIZE

    // RenderTextureを作成（パターン全体を描画するキャンバス）
    const renderTexture = RenderTexture.create({
      width: patternWidth,
      height: patternHeight,
    })

    // 一時的なコンテナを作成
    const container = new Container()

    // パターンの各文字に対応するスプライトを配置
    for (let y = 0; y < gridHeight; y++) {
      const row = bgPattern[y] || ''
      for (let x = 0; x < gridWidth; x++) {
        const bgKey = row[x] || ' '
        const texture = this.getBackgroundTexture(bgKey)

        if (texture !== Texture.EMPTY) {
          const sprite = new Sprite(texture)
          sprite.x = x * BLOCKSIZE
          sprite.y = y * BLOCKSIZE
          container.addChild(sprite)
        }
      }
    }

    // コンテナをRenderTextureに描画
    renderer.render({
      container,
      target: renderTexture,
    })

    // 一時コンテナを破棄
    container.destroy({ children: true })

    return renderTexture
  }

  /**
   * 背景用テクスチャを取得
   * BLOCKDATAから該当するフレームを取得し、スプライトシートから切り出す
   */
  private getBackgroundTexture(bgKey: string): Texture {
    const loader = AssetLoader.getInstance()
    const spritesheet = loader.getSpritesheet('tileset')

    if (!spritesheet) {
      return Texture.EMPTY
    }

    // BLOCKDATAからフレーム番号を取得
    const blockData = BLOCKDATA[bgKey]
    if (!blockData?.frame || blockData.frame.length === 0) {
      return Texture.EMPTY
    }

    const frameIndex = blockData.frame[0]
    const frameName = `frame_${frameIndex}`
    const texture = spritesheet.textures[frameName]

    return texture || Texture.EMPTY
  }

  /**
   * カメラ移動に応じて背景をスクロール（視差効果）
   * @param cameraX カメラのX座標（通常はプレイヤー中心）
   * @param cameraY カメラのY座標（通常はプレイヤー中心）
   */
  updateScroll(cameraX: number, cameraY: number) {
    // カメラ移動量に視差レートを掛けて背景をスクロール
    // 例：parallaxRateX = 0.5 の場合、背景はカメラの半分の速度で動く
    // Math.floor() で整数に丸めて1pxのずれを防止
    this.tilingSprite.tilePosition.x = Math.floor(cameraX * this.parallaxRateX)
    this.tilingSprite.tilePosition.y = Math.floor(cameraY * this.parallaxRateY)
  }

  /**
   * TilingSpriteのコンテナを取得（描画用）
   */
  get container(): TilingSprite {
    return this.tilingSprite
  }

  /**
   * リソース解放
   */
  destroy() {
    this.tilingSprite.destroy()
  }
}
