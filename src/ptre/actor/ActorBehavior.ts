import { EventDispatcher } from '../core/EventDispatcher'
import type { Actor } from './types'

/**
 * Actor の振る舞いをカプセル化するクラス
 * DisplayObject (Sprite, Container など) と組み合わせて使用する
 *
 * 使用例:
 * ```typescript
 * class ImageActor extends Sprite {
 *   readonly behavior: ActorBehavior
 *
 *   constructor(imageKey: string, x: number, y: number, tags: string[] = []) {
 *     super(texture)
 *     this.behavior = new ActorBehavior(tags)
 *   }
 *
 *   update(): void {
 *     // ゲームロジック
 *   }
 * }
 * ```
 */
export class ActorBehavior extends EventDispatcher {
  tags: Set<string>
  protected _destroyed = false

  constructor(tags: string[] = []) {
    super()
    this.tags = new Set(tags)
  }

  /**
   * タグを追加
   */
  addTag(tag: string): void {
    this.tags.add(tag)
  }

  /**
   * タグを削除
   */
  removeTag(tag: string): void {
    this.tags.delete(tag)
  }

  /**
   * 指定したタグを持っているか確認
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag)
  }

  /**
   * 新しいActorを生成してspawnイベントを発行
   */
  protected spawnActor(actor: Actor): void {
    this.dispatch('spawn', { actor })
  }

  /**
   * Actorを破壊
   * - destroyイベントを発行
   * - 呼び出し側でDisplayObjectのdestroy()も呼ぶ必要がある
   */
  destroy(): void {
    if (this._destroyed) return

    this._destroyed = true
    this.dispatch('destroy', { actor: this })
  }

  /**
   * 破壊されているかどうか
   */
  get isDestroyed(): boolean {
    return this._destroyed
  }
}
