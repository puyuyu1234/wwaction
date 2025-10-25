import { describe, it, expect } from 'vitest'
import { PhysicsComponent } from './PhysicsComponent'

describe('PhysicsComponent', () => {
  it('applies gravity', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 }
    const physics = new PhysicsComponent(entity)

    physics.applyGravity()

    expect(entity.vy).toBe(0.125)
  })

  it('applies velocity to position', () => {
    const entity = { x: 0, y: 0, vx: 2, vy: 3 }
    const physics = new PhysicsComponent(entity)

    physics.applyVelocity()

    expect(entity.x).toBe(2)
    expect(entity.y).toBe(3)
  })

  it('applies gravity multiple times', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 }
    const physics = new PhysicsComponent(entity)

    physics.applyGravity()
    physics.applyGravity()

    expect(entity.vy).toBe(0.25)
  })
})
