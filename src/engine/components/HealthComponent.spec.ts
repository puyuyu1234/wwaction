import { describe, it, expect } from 'vitest'

import { HealthComponent } from './HealthComponent'

describe('HealthComponent', () => {
  describe('ダメージ処理', () => {
    it('ダメージを受けた直後は無敵状態になる', () => {
      const health = new HealthComponent(10, 10)
      health.damage(1)
      expect(health.isInvincible()).toBe(true)
    })

    it('無敵状態中はダメージを受けない', () => {
      const health = new HealthComponent(10, 10)
      const first = health.damage(3)
      const second = health.damage(5) // 無敵中

      expect(first.actualDamage).toBeGreaterThan(0) // 1回目は受ける
      expect(second.actualDamage).toBe(0) // 2回目は受けない
    })

    it('update()を繰り返すと無敵時間が解除される', () => {
      const health = new HealthComponent(10, 10)
      health.damage(1)

      // 無敵時間が切れるまでupdate()
      for (let i = 0; i < 100; i++) {
        health.update()
      }

      const result = health.damage(2)
      expect(result.actualDamage).toBeGreaterThan(0) // 解除されている
    })

    it('HPが0になると死亡状態を返す', () => {
      const health = new HealthComponent(3, 10)
      const result = health.damage(10) // 即死級ダメージ

      expect(result.isDead).toBe(true)
      expect(health.isDead()).toBe(true)
    })

    it('HPが0以下にならない', () => {
      const health = new HealthComponent(5, 10)
      health.damage(100) // オーバーキル

      expect(health.getHp()).toBe(0) // 0で止まる
    })

    it('実際に受けたダメージ量を返す', () => {
      const health = new HealthComponent(5, 10)
      const result = health.damage(3)

      expect(result.actualDamage).toBe(3)
      expect(health.getHp()).toBe(2)
    })

    it('残りHPより大きいダメージを受けた場合、実際のダメージは残りHP分になる', () => {
      const health = new HealthComponent(3, 10)
      const result = health.damage(10)

      expect(result.actualDamage).toBe(3) // 実際は3しか減らない
      expect(health.getHp()).toBe(0)
    })
  })

  describe('回復処理', () => {
    it('回復するとHPが増える', () => {
      const health = new HealthComponent(5, 10)
      const before = health.getHp()
      health.heal(3)

      expect(health.getHp()).toBeGreaterThan(before)
    })

    it('最大HPを超えて回復しない', () => {
      const health = new HealthComponent(8, 10)
      health.heal(5) // 8 + 5 = 13 だが最大10

      expect(health.getHp()).toBe(10)
    })
  })

  describe('点滅エフェクト', () => {
    it('無敵中は点滅指示を返す', () => {
      const health = new HealthComponent(10, 10)
      health.damage(1)

      // 少なくとも1回は点滅する
      let blinked = false
      for (let i = 0; i < 10; i++) {
        if (health.shouldBlink()) {
          blinked = true
          break
        }
        health.update()
      }

      expect(blinked).toBe(true)
    })

    it('無敵時間が終わると点滅しなくなる', () => {
      const health = new HealthComponent(10, 10)
      health.damage(1)

      // 無敵時間が切れるまで待つ
      for (let i = 0; i < 100; i++) {
        health.update()
      }

      expect(health.shouldBlink()).toBe(false)
    })
  })

  describe('状態取得', () => {
    it('初期状態では無敵ではない', () => {
      const health = new HealthComponent(10, 10)
      expect(health.isInvincible()).toBe(false)
    })

    it('初期状態では死亡していない', () => {
      const health = new HealthComponent(10, 10)
      expect(health.isDead()).toBe(false)
    })

    it('HP・最大HPを取得できる', () => {
      const health = new HealthComponent(7, 15)
      expect(health.getHp()).toBe(7)
      expect(health.getMaxHp()).toBe(15)
    })
  })
})
