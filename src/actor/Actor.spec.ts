import { describe, it, expect, vi } from 'vitest'
import { Actor } from './Actor'

describe('Actor', () => {
  it('initializes with position', () => {
    const actor = new Actor(10, 20)

    expect(actor.x).toBe(10)
    expect(actor.y).toBe(20)
    expect(actor.width).toBe(0)
    expect(actor.height).toBe(0)
  })

  it('initializes with tags', () => {
    const actor = new Actor(0, 0, ['enemy', 'flying'])

    expect(actor.hasTag('enemy')).toBe(true)
    expect(actor.hasTag('flying')).toBe(true)
    expect(actor.hasTag('player')).toBe(false)
  })

  it('inherits EventDispatcher functionality', () => {
    const actor = new Actor(0, 0)
    const callback = vi.fn()

    actor.on('test', callback)
    actor.dispatch('test', 'data')

    expect(callback).toHaveBeenCalledWith('data')
  })
})
