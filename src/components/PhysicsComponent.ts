import { GRAVITY } from '@/game/config'

/**
 * 物理演算Componentが要求するインターフェース
 */
export interface IPhysicsEntity {
  vx: number
  vy: number
  x: number
  y: number
}

/**
 * 物理演算Component
 * 重力と速度の適用を担当
 */
export class PhysicsComponent {
  constructor(private entity: IPhysicsEntity) {}

  /**
   * 重力を適用
   */
  applyGravity() {
    this.entity.vy += GRAVITY
  }

  /**
   * 速度を位置に適用
   */
  applyVelocity() {
    this.entity.x += this.entity.vx
    this.entity.y += this.entity.vy
  }
}
