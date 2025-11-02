import { Rectangle } from '@core/Rectangle'

import { Entity } from './Entity'

/**
 * ゴールエンティティ
 * - ステージ右端に配置される透明な当たり判定
 * - プレイヤーが触れると nextStage イベントを発火
 * - legacy実装の GoalEntity に対応
 */
export class Goal extends Entity {
  constructor(rect: Rectangle, stage: string[][]) {
    // legacy実装: super("block", new Rectangle(0, 0, 0, 0), rect, [[""]], ["hit"])
    // rectの座標をEntityの位置として使用し、hitboxは(0,0)からの相対位置にする
    const entityRect = new Rectangle(rect.x, rect.y, 0, 0)
    const hitbox = new Rectangle(0, 0, rect.width, rect.height)
    // タグ 'goal': Playerの衝突反応で参照される
    super('goal', entityRect, hitbox, stage, ['goal'])

    // 透明アニメーション（legacy実装の playAnimation(" ") に対応）
    // アニメーションを再生しないことで非表示にする
  }

  update() {
    // ゴールは動かないため、何もしない
  }
}
