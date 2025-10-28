import { Actor } from './Actor'
import { Rectangle } from '@/core/Rectangle'

/**
 * スプライト描画機能を持つアクター
 * Phase 1では最小限の実装 (imageKey, rectangle getter/setter のみ)
 */
export class SpriteActor extends Actor {
  imageKey: string

  constructor(imageKey: string, rectangle: Rectangle, tags: string[] = []) {
    super(rectangle.x, rectangle.y, tags)
    this.imageKey = imageKey
    this.width = rectangle.width
    this.height = rectangle.height
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

  // スプライトアニメーション等は Phase 3 で実装
}
