import { PhysicsComponent } from '@game/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@game/components/TilemapCollisionComponent'
import { StageContext } from '@game/types'
import { Rectangle } from '@ptre/core/Rectangle'

import { Entity } from './Entity'

/**
 * PhysicsCoin（物理コイン）エンティティ
 * - 重力の影響を受ける
 * - 地面に当たると0.8で反発
 * - x速度を保持
 * - プレイヤーに取得されると消滅
 */
export class PhysicsCoin extends Entity {
  private physics: PhysicsComponent
  private tilemap: TilemapCollisionComponent

  /** 反発係数 */
  private static readonly RESTITUTION = 0.8

  constructor(
    centerX: number,
    centerY: number,
    context: StageContext,
    initialVx: number = 0,
    initialVy: number = 0
  ) {
    const hitbox = new Rectangle(-6, -6, 12, 12)

    // タグ 'coin': Playerの衝突反応で参照される
    super('entity', centerX, centerY, 16, 16, hitbox, ['coin'])

    this.physics = new PhysicsComponent(this)
    this.tilemap = new TilemapCollisionComponent(this, context)

    this.vx = initialVx
    this.vy = initialVy

    // スプライトアニメーション初期化
    this.playAnimation('coin')
  }

  tick() {
    super.tick()

    this.physics.applyGravity()
    this.handleWallCollision()
    this.physics.applyVelocity()
  }

  /**
   * 壁・床との衝突処理
   */
  private handleWallCollision() {
    // 横壁: 反転
    if (this.tilemap.checkLeftWall() && this.vx < 0) {
      this.tilemap.bounceAtLeftWall()
    }
    if (this.tilemap.checkRightWall() && this.vx > 0) {
      this.tilemap.bounceAtRightWall()
    }

    // 天井: 停止
    if (this.tilemap.checkUpWall() && this.vy < 0) {
      this.tilemap.stopAtUpWall()
    }

    // 床: 反発
    if (this.tilemap.checkDownWall() && this.vy > 0) {
      this.tilemap.bounceAtDownWall(PhysicsCoin.RESTITUTION)
    }
  }
}
