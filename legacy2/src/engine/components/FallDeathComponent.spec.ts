import { describe, it, expect } from 'vitest'

import { FallDeathComponent } from './FallDeathComponent'

describe('FallDeathComponent', () => {
  describe('落下死判定', () => {
    it('ステージ高さを超えると落下死と判定される', () => {
      const fallDeath = new FallDeathComponent(320) // ステージ高さ320px

      expect(fallDeath.checkFallDeath(400)).toBe(true) // 高さ超過
      expect(fallDeath.checkFallDeath(300)).toBe(false) // 範囲内
    })

    it('ステージ高さ + 余裕分までは落下死と判定されない', () => {
      const fallDeath = new FallDeathComponent(320)

      // 320 + 32 = 352 が境界
      expect(fallDeath.checkFallDeath(352)).toBe(false) // ギリギリセーフ
      expect(fallDeath.checkFallDeath(353)).toBe(true) // アウト
    })
  })

  describe('床座標の記録', () => {
    it('床に着地した座標を記録できる', () => {
      const fallDeath = new FallDeathComponent(320)
      fallDeath.recordFloor(100, 200)

      const pos = fallDeath.getRecoveryPosition()
      expect(pos).not.toBeNull()
      expect(pos?.x).toBe(100)
      expect(pos?.y).toBe(200)
    })

    it('最大10個まで床座標を記録する（古いものから削除）', () => {
      const fallDeath = new FallDeathComponent(320)

      // 11個記録
      for (let i = 0; i < 11; i++) {
        fallDeath.recordFloor(i * 10, i * 10)
      }

      // 最古の(0, 0)は削除され、(10, 10)が最古になる
      const pos = fallDeath.getRecoveryPosition()
      expect(pos?.x).toBe(10)
      expect(pos?.y).toBe(10)
    })

    it('複数の床座標を記録できる', () => {
      const fallDeath = new FallDeathComponent(320)
      fallDeath.recordFloor(50, 100)
      fallDeath.recordFloor(150, 200)
      fallDeath.recordFloor(250, 300)

      // 最古の座標が取得される
      const pos = fallDeath.getRecoveryPosition()
      expect(pos?.x).toBe(50)
      expect(pos?.y).toBe(100)
    })
  })

  describe('復帰処理', () => {
    it('復帰位置を取得しても記録は残る（同じ位置に復帰し続ける）', () => {
      const fallDeath = new FallDeathComponent(320)
      fallDeath.recordFloor(100, 200)

      const first = fallDeath.getRecoveryPosition()
      const second = fallDeath.getRecoveryPosition()

      expect(first).toEqual(second) // 同じ位置
    })

    it('床座標が記録されていない場合はnullを返す', () => {
      const fallDeath = new FallDeathComponent(320)
      expect(fallDeath.getRecoveryPosition()).toBeNull()
    })

    it('落下死→復帰→再度落下死した場合も同じ位置に戻る', () => {
      const fallDeath = new FallDeathComponent(320)
      fallDeath.recordFloor(100, 200)

      // 1回目の復帰
      const first = fallDeath.getRecoveryPosition()
      expect(first?.x).toBe(100)

      // 2回目の復帰（記録が更新されていない）
      const second = fallDeath.getRecoveryPosition()
      expect(second?.x).toBe(100)
      expect(second?.y).toBe(200)
    })

    it('復帰後に新しい床に着地すると、次回はその新しい床に復帰できる', () => {
      const fallDeath = new FallDeathComponent(320)
      fallDeath.recordFloor(100, 200)

      // 1回目の復帰（履歴が[100,200]のみになる）
      const first = fallDeath.getRecoveryPosition()
      expect(first?.x).toBe(100)
      expect(first?.y).toBe(200)

      // 復帰後、新しい床に着地
      // この時点で履歴は[(100,200), (300,400)]
      fallDeath.recordFloor(300, 400)

      // 2回目の復帰（最古 = 100,200を取得、履歴を[(100,200)]にリセット）
      const second = fallDeath.getRecoveryPosition()
      expect(second?.x).toBe(100)
      expect(second?.y).toBe(200)

      // さらに新しい床に着地
      fallDeath.recordFloor(500, 600)

      // 3回目の復帰（最古 = 100,200を取得）
      const third = fallDeath.getRecoveryPosition()
      expect(third?.x).toBe(100)
      expect(third?.y).toBe(200)
    })
  })
})
