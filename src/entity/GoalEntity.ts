import { Entity } from './Entity'

import { Rectangle } from '@/core/Rectangle'

/**
 * GoalEntity（ゴール判定エンティティ）
 * - 描画・物理演算なし
 * - プレイヤーとの衝突でステージクリア判定
 * - 矩形領域のみで構成される透明エンティティ
 */
export class GoalEntity extends Entity {
  constructor(rect: Rectangle) {
    // stageは不要だが、Entityの型に合わせて空配列を渡す
    // hitboxは相対座標で(0,0)から始まる領域（全体が当たり判定）
    const hitbox = new Rectangle(0, 0, rect.width, rect.height)
    super('goal', rect, hitbox, [['']], ['goal'])
  }

  // 物理演算不要（何もしない）
  update() {
    // 空実装
  }
}
