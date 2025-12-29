import { GRAVITY } from '@game/config'

interface IPhysicsEntity {
  vx: number
  vy: number
  x: number
  y: number
}

/**
 * 物理演算Component
 */
export class PhysicsComponent {
  constructor(private entity: IPhysicsEntity) {}

  applyGravity() {
    this.entity.vy += GRAVITY
  }

  applyVelocity() {
    this.entity.x += this.entity.vx
    this.entity.y += this.entity.vy
  }
}
