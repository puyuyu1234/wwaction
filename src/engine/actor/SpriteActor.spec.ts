import { describe, it, expect } from 'vitest'

import { SpriteActor } from './SpriteActor'

import { Rectangle } from '@core/Rectangle'

describe('SpriteActor', () => {
  it('initializes with imageKey and rectangle', () => {
    const rect = new Rectangle(10, 20, 16, 16)
    const sprite = new SpriteActor('player', rect)

    expect(sprite.imageKey).toBe('player')
    expect(sprite.x).toBe(10)
    expect(sprite.y).toBe(20)
    expect(sprite.width).toBe(16)
    expect(sprite.height).toBe(16)
  })

  it('provides rectangle getter', () => {
    const rect = new Rectangle(10, 20, 16, 16)
    const sprite = new SpriteActor('player', rect)

    const result = sprite.rectangle

    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(16)
    expect(result.height).toBe(16)
  })

  it('provides rectangle setter', () => {
    const rect = new Rectangle(0, 0, 16, 16)
    const sprite = new SpriteActor('player', rect)

    sprite.rectangle = new Rectangle(100, 200, 32, 32)

    expect(sprite.x).toBe(100)
    expect(sprite.y).toBe(200)
    expect(sprite.width).toBe(32)
    expect(sprite.height).toBe(32)
  })
})
