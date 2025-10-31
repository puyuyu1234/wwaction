import { Rectangle } from '@core/Rectangle'

import { Entity } from './Entity'

/**
 * GoalEntity（ゴール判定エンティティ）
 * - 描画・物理演算なし
 * - プレイヤーとの衝突でステージクリア判定
 * - 矩形領域のみで構成される透明エンティティ
 */
export class GoalEntity extends Entity {
  constructor(rect: Rectangle) {
    // アンカーポイントが中央(0.5, 0.5)なので、座標は中心を指す
    // 中心座標に変換: x+width/2, y+height/2
    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2
    const centerRect = new Rectangle(centerX, centerY, rect.width, rect.height)

    // hitboxも中心基準に変換: legacy(0,0,w,h) → 中心基準(-w/2,-h/2,w,h)
    const hitbox = new Rectangle(-rect.width / 2, -rect.height / 2, rect.width, rect.height)
    super('goal', centerRect, hitbox, [['']], ['goal'])
  }

  // 物理演算不要（何もしない）
  update() {
    // 空実装
  }
}
