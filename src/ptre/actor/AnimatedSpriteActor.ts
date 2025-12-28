import { AssetLoader } from '../core/AssetLoader'
import { AnimatedSprite, Texture } from 'pixi.js'

import { ActorBehavior } from './ActorBehavior'

/**
 * アニメーションスプライト描画機能を持つアクター
 * - PixiJS の AnimatedSprite を直接継承
 * - PixiJS標準の animationSpeed と loop を使用
 * - アンカーポイントはデフォルトで中央(0.5, 0.5)、必要に応じて左上(0, 0)などに変更可能
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
export class AnimatedSpriteActor extends AnimatedSprite {
  readonly behavior: ActorBehavior
  imageKey: string
  protected currentAnimationName: string | null = null
  protected animationStopFrame = 0 // 強制アニメーション中の残りフレーム数

  /**
   * @param imageKey スプライトシートのキー
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
    // 初期テクスチャを取得（空のテクスチャ配列で初期化）
    super([Texture.EMPTY])

    this.imageKey = imageKey
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.behavior = new ActorBehavior(tags)

    // アンカーポイントを設定
    this.anchor.set(anchorX, anchorY)

    // autoUpdateを有効化
    this.autoUpdate = true
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
   * アニメーションを再生
   * @param animationName アニメーション名
   */
  playAnimation(animationName: string): void {
    // 強制アニメーション中は切り替えない
    if (this.animationStopFrame > 0) {
      return
    }

    // 既に同じアニメーションが再生中なら何もしない
    if (this.currentAnimationName === animationName) {
      return
    }

    const loader = AssetLoader.getInstance()
    const textures = loader.getAnimationTextures(this.imageKey, animationName)

    if (!textures) {
      console.warn(`Animation "${animationName}" not found for imageKey "${this.imageKey}"`)
      return
    }

    // アニメーション速度とループ設定を取得
    const animationSpeed = loader.getAnimationSpeed(this.imageKey, animationName)
    const loop = loader.getAnimationLoop(this.imageKey, animationName)

    // テクスチャを差し替え
    this.textures = textures
    this.animationSpeed = animationSpeed
    this.loop = loop

    // animationSpeed=0（静止画）の場合は再生しない
    if (animationSpeed > 0) {
      this.play()
    } else {
      this.gotoAndStop(0) // 最初のフレームで停止
    }

    // 状態を更新
    this.currentAnimationName = animationName
  }

  /**
   * アニメーションを停止
   */
  stopAnimation(): void {
    this.currentAnimationName = null
    this.stop()
  }

  /**
   * 強制的にアニメーションを再生し、指定フレーム数だけ他のアニメーションに切り替わらないようにする
   * @param animationName アニメーション名
   * @param frames 固定するフレーム数
   */
  playAnimationForced(animationName: string, frames: number): void {
    // 既に同じアニメーションが再生中なら何もしない
    if (this.currentAnimationName === animationName && this.animationStopFrame > 0) {
      return
    }

    const loader = AssetLoader.getInstance()
    const textures = loader.getAnimationTextures(this.imageKey, animationName)

    if (!textures) {
      console.warn(`Animation "${animationName}" not found for imageKey "${this.imageKey}"`)
      return
    }

    // アニメーション速度とループ設定を取得
    const animationSpeed = loader.getAnimationSpeed(this.imageKey, animationName)
    const loop = loader.getAnimationLoop(this.imageKey, animationName)

    // テクスチャを差し替え
    this.textures = textures
    this.animationSpeed = animationSpeed
    this.loop = loop

    // animationSpeed=0（静止画）の場合は再生しない
    if (animationSpeed > 0) {
      this.play()
    } else {
      this.gotoAndStop(0)
    }

    // 強制アニメーション設定
    this.animationStopFrame = frames
    this.currentAnimationName = animationName
  }

  /**
   * フレーム更新
   * - 強制アニメーションのフレームカウンタを減らす
   */
  update(): void {
    if (this.isDestroyed) return

    // 強制アニメーションのフレームカウンタを減らす
    if (this.animationStopFrame > 0) {
      this.animationStopFrame--
    }
  }

  /**
   * Actorを破壊
   */
  destroy(): void {
    this.behavior.destroy()
    super.destroy()
  }
}
