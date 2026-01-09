import { StageContext } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/**
 * Coin（コイン）エンティティ
 * - 空中に浮いている
 * - プレイヤーに取得されると消滅
 * - ステージ再読み込み時に復活
 */
export class Coin extends Entity {
  constructor(centerX: number, centerY: number, _context: StageContext) {
    const hitbox = new Rectangle(-6, -6, 12, 12)

    // タグ 'coin': Playerの衝突反応で参照される
    super('entity', centerX, centerY, 16, 16, hitbox, ['coin'])

    // スプライトアニメーション初期化
    this.playAnimation('coin')
  }
}
