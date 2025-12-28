import { describe, it, expect, vi } from 'vitest'
import { Wind } from './Wind'

// AssetLoaderをモック
vi.mock('@ptre/core/AssetLoader', () => ({
  AssetLoader: {
    getInstance: () => ({
      getAnimationTextures: () => null,
      getAnimationSpeed: () => 0.1,
      getAnimationLoop: () => true,
    }),
  },
}))

describe('Wind', () => {
  // 簡単なステージデータ（空のステージ）
  const emptyStage: string[][] = [
    '                    '.split(''),
    '                    '.split(''),
    '                    '.split(''),
    '                    '.split(''),
    '                    '.split(''),
    'gggggggggggggggggggg'.split(''), // 地面
  ]

  describe('初期化', () => {
    it('指定した位置に生成される', () => {
      const wind = new Wind(100, 50, 2, emptyStage)

      expect(wind.x).toBe(100)
      expect(wind.y).toBe(50)
      expect(wind.vx).toBe(2)
    })

    it('windタグを持つ', () => {
      const wind = new Wind(100, 50, 2, emptyStage)

      expect(wind.hasTag('wind')).toBe(true)
    })
  })

  describe('tick', () => {
    it('tick()を呼んでも例外が発生しない', () => {
      const wind = new Wind(100, 50, 2, emptyStage)

      // 複数回呼び出してもエラーにならないことを確認
      expect(() => {
        for (let i = 0; i < 100; i++) {
          wind.tick()
        }
      }).not.toThrow()
    })

    it('重力で落下する', () => {
      const wind = new Wind(100, 50, 0, emptyStage)
      const initialY = wind.y

      // 10フレーム更新
      for (let i = 0; i < 10; i++) {
        wind.tick()
      }

      // 重力で下に移動しているはず
      expect(wind.y).toBeGreaterThan(initialY)
    })

    it('水平方向に移動する', () => {
      const wind = new Wind(100, 50, 2, emptyStage)
      const initialX = wind.x

      wind.tick()

      // vx > 0 なので右に移動
      expect(wind.x).toBeGreaterThan(initialX)
    })
  })

  describe('setWallBehavior', () => {
    it('stopモードに切り替えられる', () => {
      const wind = new Wind(100, 50, 2, emptyStage)

      expect(() => {
        wind.setWallBehavior('stop')
      }).not.toThrow()
    })

    it('bounceモードに切り替えられる', () => {
      const wind = new Wind(100, 50, 2, emptyStage)

      expect(() => {
        wind.setWallBehavior('bounce')
      }).not.toThrow()
    })
  })
})
