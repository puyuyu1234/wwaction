import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/**
 * ゴールエンティティ
 * - ステージ右端に配置される透明な当たり判定
 * - プレイヤーが触れると nextStage イベントを発火
 */
export class Goal extends Entity {
  constructor(x: number, y: number, width: number, height: number) {
    // hitboxはエンティティ全体
    const hitbox = new Rectangle(0, 0, width, height)
    // タグ 'goal': Playerの衝突反応で参照される
    // imageKey は 'goal' だが、アニメーションを再生しないことで非表示にする
    super('goal', x, y, width, height, hitbox, ['goal'])

    // アンカーを左上に変更（デフォルトは中央）
    this.anchor.set(0, 0)
  }

  tick() {
    super.tick()
    // ゴールは動かないため、何もしない
  }
}
