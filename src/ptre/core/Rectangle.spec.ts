import { describe, it, expect } from 'vitest'

import { Rectangle } from './Rectangle'

describe('Rectangle', () => {
  describe('getters', () => {
    it('calculates boundaries correctly', () => {
      const rect = new Rectangle(10, 20, 16, 16)

      expect(rect.left).toBe(10)
      expect(rect.right).toBe(26) // 10 + 16 (境界の外側)
      expect(rect.top).toBe(20)
      expect(rect.bottom).toBe(36) // 20 + 16 (境界の外側)
    })

    it('calculates center correctly', () => {
      const rect = new Rectangle(0, 0, 16, 16)

      expect(rect.centerX).toBe(8)
      expect(rect.centerY).toBe(8)
      expect(rect.center).toEqual([8, 8])
    })
  })

  describe('hitTest', () => {
    it('detects overlap', () => {
      const rect1 = new Rectangle(0, 0, 16, 16)
      const rect2 = new Rectangle(8, 8, 16, 16)

      expect(rect1.hitTest(rect2)).toBe(true)
      expect(rect2.hitTest(rect1)).toBe(true)
    })

    it('detects no overlap', () => {
      const rect1 = new Rectangle(0, 0, 16, 16)
      const rect2 = new Rectangle(16, 0, 16, 16)

      expect(rect1.hitTest(rect2)).toBe(false)
    })
  })

  describe('contain', () => {
    it('detects point inside', () => {
      const rect = new Rectangle(0, 0, 16, 16)

      expect(rect.contain(8, 8)).toBe(true)
      expect(rect.contain(0, 0)).toBe(true)
    })

    it('detects point outside', () => {
      const rect = new Rectangle(0, 0, 16, 16)

      // (16, 16) は境界の外なので含まれない
      expect(rect.contain(16, 16)).toBe(false)
      expect(rect.contain(-1, 8)).toBe(false)
    })
  })

  describe('clone', () => {
    it('creates independent copy', () => {
      const rect1 = new Rectangle(10, 20, 16, 16)
      const rect2 = rect1.clone()

      rect2.x = 100

      expect(rect1.x).toBe(10)
      expect(rect2.x).toBe(100)
    })
  })
})
