import { AssetLoader } from '@core/AssetLoader'
import { Rectangle } from '@core/Rectangle'
import { AnimatedSprite } from 'pixi.js'


import { Actor } from './Actor'


/**
 * スプライト描画機能を持つアクター
 * - PixiJS の AnimatedSprite を内包
 * - PixiJS標準の animationSpeed と loop を使用
 * - legacy の SpriteActor の playAnimation / stopAnimation に相当
 */
export class SpriteActor extends Actor {
  imageKey: string
  protected animatedSprite?: AnimatedSprite
  protected currentAnimationName: string | null = null

  constructor(imageKey: string, rectangle: Rectangle, tags: string[] = []) {
    super(rectangle.x, rectangle.y, tags)
    this.imageKey = imageKey
    this.width = rectangle.width
    this.height = rectangle.height
  }

  /**
   * アニメーションを再生
   * @param animationName アニメーション名
   */
  playAnimation(animationName: string) {
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

    // 既存の AnimatedSprite を破棄
    if (this.animatedSprite) {
      this.animatedSprite.destroy()
    }

    // 新しい AnimatedSprite を作成
    this.animatedSprite = new AnimatedSprite(textures)
    this.animatedSprite.animationSpeed = animationSpeed
    this.animatedSprite.loop = loop
    this.animatedSprite.autoUpdate = true // PixiJS標準の自動更新を使用

    // アンカーポイントを中央に設定（反転時も位置がズレない）
    this.animatedSprite.anchor.set(0.5, 0.5)

    // animationSpeed=0（静止画）の場合は再生しない
    if (animationSpeed > 0) {
      this.animatedSprite.play()
    } else {
      this.animatedSprite.gotoAndStop(0) // 最初のフレームで停止
    }

    // 状態を更新
    this.currentAnimationName = animationName
  }

  /**
   * アニメーションを停止
   */
  stopAnimation() {
    this.currentAnimationName = null
    if (this.animatedSprite) {
      this.animatedSprite.stop()
      this.animatedSprite.destroy()
      this.animatedSprite = undefined
    }
  }

  /**
   * AnimatedSprite インスタンスを取得（描画用）
   */
  getAnimatedSprite(): AnimatedSprite | undefined {
    return this.animatedSprite
  }

  get rectangle(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height)
  }

  set rectangle(rect: Rectangle) {
    this.x = rect.x
    this.y = rect.y
    this.width = rect.width
    this.height = rect.height
  }
}
