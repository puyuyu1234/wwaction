import { AssetLoader } from '@core/AssetLoader'
import { BLOCKDATA } from '@game/config'
import { TilingSprite, Texture } from 'pixi.js'

/**
 * 視差スクロール背景レイヤー
 * - PixiJSのTilingSpriteを使用した高速な無限リピート背景
 * - カメラ追従レートで視差効果を実現
 * - GPU Shaderでパターンリピート処理（legacy方式の300個Sprite → 1個のTilingSpriteに最適化）
 */
export class ParallaxBackground {
  private tilingSprite: TilingSprite
  private parallaxRateX: number
  private parallaxRateY: number

  /**
   * @param bgPattern 背景パターン配列（例：['y']）
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

    // 背景パターンの最初の文字からテクスチャを取得
    const bgKey = bgPattern[0] || ' '
    const texture = this.getBackgroundTexture(bgKey)

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
   * 背景用テクスチャを取得
   * BLOCKDATAから該当するフレームを取得し、スプライトシートから切り出す
   */
  private getBackgroundTexture(bgKey: string): Texture {
    const loader = AssetLoader.getInstance()
    const spritesheet = loader.getSpritesheet('tileset')

    if (!spritesheet) {
      console.warn('[ParallaxBackground] Tileset spritesheet not loaded, using fallback')
      return Texture.EMPTY
    }

    // BLOCKDATAからフレーム番号を取得
    const blockData = BLOCKDATA[bgKey]
    if (!blockData?.frame || blockData.frame.length === 0) {
      console.warn(`[ParallaxBackground] No block data for "${bgKey}", using fallback`)
      return Texture.EMPTY
    }

    const frameIndex = blockData.frame[0]
    const frameName = `frame_${frameIndex}`
    const texture = spritesheet.textures[frameName]

    if (!texture) {
      console.warn(`[ParallaxBackground] Frame "${frameName}" not found, using fallback`)
      return Texture.EMPTY
    }

    console.log(`[ParallaxBackground] Using texture "${frameName}" for background "${bgKey}"`)
    return texture
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
