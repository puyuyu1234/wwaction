import { AssetLoader } from '../core/AssetLoader'
import { Sprite } from 'pixi.js'

import { ActorBehavior } from './ActorBehavior'

/**
 * 単一画像を表示するアクター
 * - PixiJS の Sprite を直接継承
 * - AssetLoader.loadImage() で読み込んだテクスチャをそのまま表示
 * - ピクセルゲームなど、単純な画像表示に最適
 *
 * ## 画像の反転について
 * 画像を反転したい場合は、texture.rotate を使用してください。
 * これにより、width/height/scaleに影響を与えずにUV座標レベルで反転できます。
 *
 * 例:
 * ```typescript
 * // 水平反転
 * actor.texture.rotate = 12 // TextureRotation.MIRROR_HORIZONTAL
 *
 * // 垂直反転
 * actor.texture.rotate = 8  // TextureRotation.MIRROR_VERTICAL
 *
 * // 通常に戻す
 * actor.texture.rotate = 0  // TextureRotation.NONE
 * ```
 */
export class SpriteActor extends Sprite {
  readonly behavior: ActorBehavior
  imageKey: string

  /**
   * @param imageKey 画像のキー（AssetLoader.loadImage で登録したキー）
   * @param x アンカーポイント基準のX座標
   * @param y アンカーポイント基準のY座標
   * @param width 幅
   * @param height 高さ
   * @param tags タグ配列
   * @param anchorX アンカーポイントX（0=左端, 0.5=中央, 1=右端）デフォルト: 0.5
   * @param anchorY アンカーポイントY（0=上端, 0.5=中央, 1=下端）デフォルト: 0.5
   */
  constructor(
    imageKey: string,
    x: number,
    y: number,
    width: number,
    height: number,
    tags: string[] = [],
    anchorX = 0.5,
    anchorY = 0.5
  ) {
    const loader = AssetLoader.getInstance()
    const texture = loader.getTexture(imageKey)

    if (!texture) {
      throw new Error(`Texture "${imageKey}" not loaded. Call AssetLoader.loadImage() first.`)
    }

    super(texture)

    this.imageKey = imageKey
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.behavior = new ActorBehavior(tags)

    // アンカーポイントを設定
    this.anchor.set(anchorX, anchorY)
  }

  /**
   * タグを持っているか確認
   */
  hasTag(tag: string): boolean {
    return this.behavior.hasTag(tag)
  }

  /**
   * 破壊されているかどうか
   */
  get isDestroyed(): boolean {
    return this.behavior.isDestroyed
  }

  /**
   * ゲームロジック更新（毎フレーム呼ばれる）
   */
  tick(): void {
    if (this.isDestroyed) return
    // 特に処理なし（必要に応じてオーバーライド）
  }

  /**
   * Actorを破壊
   */
  destroy(): void {
    this.behavior.destroy()
    super.destroy()
  }
}
