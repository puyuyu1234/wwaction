import { EventDispatcher } from '@/core/EventDispatcher'

/**
 * ゲーム内のアクター基底クラス
 * PixiJS と統合したゲームオブジェクト
 */
export class Actor extends EventDispatcher {
  x: number
  y: number
  width = 0
  height = 0
  tags: Set<string>

  constructor(x: number, y: number, tags: string[] = []) {
    super()
    this.x = x
    this.y = y
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
  hasTag(tagName: string): boolean {
    return this.tags.has(tagName)
  }

  /**
   * フレーム更新（サブクラスでオーバーライド）
   */
  update?(): void
}
