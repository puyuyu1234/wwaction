import type { Container } from 'pixi.js'
import type { ActorBehavior } from './ActorBehavior'

/**
 * Actor 型定義
 * - Container (PixiJS DisplayObject) を継承
 * - ActorBehavior を持つ
 * - よく使うメソッドを委譲
 * - update() メソッドを実装する
 *
 * この型を満たすクラスは Scene.add() で追加できる
 *
 * 使用例:
 * ```typescript
 * class ImageActor extends Sprite {
 *   readonly behavior: ActorBehavior
 *
 *   hasTag(tag: string): boolean {
 *     return this.behavior.hasTag(tag)
 *   }
 *
 *   get isDestroyed(): boolean {
 *     return this.behavior.isDestroyed
 *   }
 *
 *   destroy(): void {
 *     this.behavior.destroy()
 *     super.destroy()
 *   }
 *
 *   update(): void { }
 * }
 *
 * const actor: Actor = new ImageActor(...)
 * scene.add(actor)  // ✅ OK
 * ```
 */
export type Actor = Container & {
  behavior: ActorBehavior
  hasTag(tag: string): boolean
  isDestroyed: boolean
  destroy(): void
  update(): void
}
