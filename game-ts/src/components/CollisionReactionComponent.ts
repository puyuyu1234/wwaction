import type { Entity } from '@/entity/Entity'

/**
 * 衝突時の反応を処理するハンドラ型
 */
export type CollisionHandler = (other: Entity) => void

/**
 * エンティティ間の衝突反応を管理するComponent
 * 元のJS実装の on("hitWind", ...) の思想を継承しつつ型安全に
 */
export class CollisionReactionComponent {
  private reactions = new Map<string, CollisionHandler>()

  /**
   * 特定タイプのエンティティとの衝突時の反応を登録
   * @param targetType 衝突相手のimageKey (例: 'wind', 'enemy', 'potion')
   * @param handler 衝突時に実行される関数
   */
  on(targetType: string, handler: CollisionHandler) {
    this.reactions.set(targetType, handler)
  }

  /**
   * 衝突を処理する
   * @param other 衝突相手のEntity
   */
  handle(other: Entity) {
    const handler = this.reactions.get(other.imageKey)
    handler?.(other)
  }

  /**
   * 登録された反応をクリア
   */
  clear() {
    this.reactions.clear()
  }
}
