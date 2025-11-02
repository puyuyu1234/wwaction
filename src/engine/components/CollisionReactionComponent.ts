import type { Entity } from '@entity/Entity'

/**
 * 衝突時の反応を処理するハンドラ型
 */
type CollisionHandler = (other: Entity) => void

/**
 * エンティティ間の衝突反応を管理するComponent（タグベース）
 *
 * 使用例:
 * ```typescript
 * // 'wind' タグを持つエンティティと衝突した時
 * this.collisionReaction.on('wind', (wind) => {
 *   this.vy = -3; // ジャンプ
 * });
 *
 * // 'enemy' タグを持つエンティティと衝突した時
 * this.collisionReaction.on('enemy', (enemy) => {
 *   this.damage(1);
 * });
 * ```
 */
export class CollisionReactionComponent {
  private reactions = new Map<string, CollisionHandler>()

  /**
   * 特定タグを持つエンティティとの衝突時の反応を登録
   * @param targetTag 衝突相手のタグ (例: 'wind', 'enemy', 'potion')
   * @param handler 衝突時に実行される関数
   */
  on(targetTag: string, handler: CollisionHandler) {
    this.reactions.set(targetTag, handler)
  }

  /**
   * 衝突を処理する（タグベース）
   * 相手エンティティの全てのタグをチェックし、登録された反応を実行
   * @param other 衝突相手のEntity
   */
  handle(other: Entity) {
    // 相手の全タグをチェック
    other.tags.forEach((tag) => {
      const handler = this.reactions.get(tag)
      if (handler) {
        handler(other)
      }
    })
  }

  /**
   * 登録された反応をクリア
   */
  clear() {
    this.reactions.clear()
  }
}
