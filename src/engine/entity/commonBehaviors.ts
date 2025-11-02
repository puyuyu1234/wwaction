import type { Entity } from './Entity'

/**
 * エンティティ間で共通する振る舞い（反応）を定義
 *
 * 設計方針:
 * - 設計が固まっていない段階では、共通の挙動を一箇所に集約
 * - 変更時は1ファイルの修正で全エンティティに反映
 * - 必要に応じて各エンティティで個別にオーバーライド可能
 */

/**
 * 風ジャンプの速度（上方向）
 */
const WIND_JUMP_POWER = -3

export const CommonBehaviors = {
  /**
   * 風に触れたときのジャンプ動作
   * 多くのエンティティで共通の挙動
   *
   * @param entity ジャンプするエンティティ
   */
  windJump: (entity: Entity) => {
    entity.vy = WIND_JUMP_POWER
  },
} as const
