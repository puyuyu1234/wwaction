import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { StageContext } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { CommonBehaviors } from './commonBehaviors'
import { Entity } from './Entity'

/**
 * フン（糞）エンティティ
 * - フンコロガシが発射する弾
 * - 成長フェーズ: 4段階で大きくなる（fun_1 → fun_4）
 * - 飛行フェーズ: 前方に移動、重力落下、風で跳ねる
 */
export class Fun extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent
  private _phase: 'growing' | 'flying' = 'growing'
  private growthLevel = 0 // 0~3

  constructor(centerX: number, centerY: number, context: StageContext) {
    const hitbox = new Rectangle(-5, -5, 10, 10)
    // 成長中はダメージ判定なし（発射時にenemyタグを追加）
    super('entity', centerX, centerY, 16, 16, hitbox, [])

    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, context)

    // 風に当たると跳ねる
    this.collisionReaction.on('wind', () => {
      CommonBehaviors.windJump(this)
    })

    // 初期状態: fun_1（成長レベル0）
    this.playAnimation('fun')
    this.gotoAndStop(0)
  }

  get phase(): 'growing' | 'flying' {
    return this._phase
  }

  /**
   * フンを成長させる
   * @returns 最大サイズに達したらtrue
   */
  grow(): boolean {
    if (this.growthLevel < 3) {
      this.growthLevel++
      this.gotoAndStop(this.growthLevel)
    }
    return this.growthLevel >= 3
  }

  /**
   * フンを発射する
   * @param direction 発射方向（1=右, -1=左）
   */
  fire(direction: number) {
    this._phase = 'flying'
    this.tags.add('enemy') // 発射したらダメージ判定有効化
    this.vx = direction * 1
  }

  /**
   * フンの位置を更新（成長中はフンコロガシに追従）
   */
  updatePosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  tick() {
    super.tick()

    if (this._phase === 'flying') {
      this.physics.applyGravity()
      CommonBehaviors.bounceWalls(this, this.tilemap)
      this.physics.applyVelocity()

      // 移動方向に回転（転がる演出）
      this.rotation += this.vx * 0.1
    }
  }
}
