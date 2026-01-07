import { BASE_BLOCKDATA } from '@game/config'
import { StageLayers, StageContext } from '@game/types'
import { describe, it, expect, vi } from 'vitest'

import { DekaNasake } from './DekaNasake'

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

/** テスト用のStageContextを作成 */
function createTestContext(layers: StageLayers): StageContext {
  return { layers, blockData: BASE_BLOCKDATA }
}

describe('DekaNasake', () => {
  // 床あり・壁なしのステージ
  const openStage = createTestContext([
    [
      '                    '.split(''),
      '                    '.split(''),
      '                    '.split(''),
      '                    '.split(''),
      'gggggggggggggggggggg'.split(''), // 床
    ],
  ])

  // 左側に壁があるステージ
  const leftWallStage = createTestContext([
    [
      'g                   '.split(''),
      'g                   '.split(''),
      'g                   '.split(''),
      'g                   '.split(''),
      'gggggggggggggggggggg'.split(''),
    ],
  ])

  describe('移動と壁での反転', () => {
    it('左方向に移動し、壁に当たると右向きに反転する', () => {
      // 壁の近く（x=32）に配置して左に移動
      const deka = new DekaNasake(32, 48, leftWallStage)
      const initialScaleX = deka.scale.x

      // 壁に到達するまでtick
      for (let i = 0; i < 50; i++) {
        deka.tick()
      }

      // scale.xが反転している（左→右）
      expect(deka.scale.x).toBe(-initialScaleX)
    })
  })

  describe('崖での反転', () => {
    it('崖を検知すると反転する', () => {
      // 左側が崖のステージ（初期は左向きなので左に進む）
      const cliffLeftStage = createTestContext([
        [
          '                    '.split(''),
          '                    '.split(''),
          '                    '.split(''),
          '                    '.split(''),
          '              gggggg'.split(''), // 左側が崖
        ],
      ])
      const deka = new DekaNasake(240, 48, cliffLeftStage)
      const initialScaleX = deka.scale.x

      // 床に着地して崖を検知するまでtick
      for (let i = 0; i < 60; i++) {
        deka.tick()
      }

      // 崖で反転している
      expect(deka.scale.x).toBe(-initialScaleX)
    })
  })

  describe('風に当たった時の状態遷移', () => {
    it('風に当たるとhitWind状態になり、その後走り出す', () => {
      const deka = new DekaNasake(100, 48, openStage)
      const initialVx = Math.abs(deka.vx)

      // 風との衝突をシミュレート
      deka.handleCollision({ tags: new Set(['wind']), vx: 3, vy: 0 } as never)

      // 上方向に吹き飛ばされる
      expect(deka.vy).toBeLessThan(0)

      // hitWind期間（12フレーム）を超えてtick
      for (let i = 0; i < 15; i++) {
        deka.tick()
      }

      // run状態になり、速度が上がっている
      expect(Math.abs(deka.vx)).toBeGreaterThan(initialVx)
    })

    it('run状態は一定時間後にwalk状態に戻る', () => {
      const deka = new DekaNasake(100, 48, openStage)
      const walkSpeed = Math.abs(deka.vx)

      // 風に当たる
      deka.handleCollision({ tags: new Set(['wind']), vx: 3, vy: 0 } as never)

      // hitWind + run期間（12 + 24 = 36フレーム）を超えてtick
      for (let i = 0; i < 40; i++) {
        deka.tick()
      }

      // walk状態に戻り、速度も元に戻る
      expect(Math.abs(deka.vx)).toBeCloseTo(walkSpeed, 1)
    })
  })
})
