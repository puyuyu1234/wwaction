import { describe, it, expect } from 'vitest'

import { Wind } from './Wind'

describe('Wind - 左右の壁跳ね返り', () => {
  it('左の壁に当たると右向きに跳ね返る', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' '],
      ['a', ' ', ' ', ' ', ' '],
    ]
    const wind = new Wind(20, 0, -2, stage) // 左向きに移動

    // 左壁に当たるまで更新
    for (let i = 0; i < 20; i++) {
      wind.update()
    }

    // ふるまい：「左壁に当たったら右向きになる」
    expect(wind.vx).toBeGreaterThan(0)
  })

  it('右の壁に当たると左向きに跳ね返る', () => {
    const stage = [
      [' ', ' ', ' ', ' ', 'a'],
      [' ', ' ', ' ', ' ', 'a'],
    ]
    const wind = new Wind(16, 0, 2, stage) // 右向きに移動

    // 右壁に当たるまで更新
    for (let i = 0; i < 20; i++) {
      wind.update()
    }

    // ふるまい：「右壁に当たったら左向きになる」
    expect(wind.vx).toBeLessThan(0)
  })

  it('壁で跳ね返った後も継続して移動する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const wind = new Wind(48, 0, -1, stage) // 左向きに移動

    // 左壁で跳ね返るまで
    for (let i = 0; i < 50; i++) {
      wind.update()
    }
    expect(wind.vx).toBeGreaterThan(0) // 右向きに反転

    const xAfterBounce = wind.x

    // さらに移動を続ける
    for (let i = 0; i < 10; i++) {
      wind.update()
    }

    // ふるまい：「跳ね返った後も移動し続ける」
    expect(wind.x).toBeGreaterThan(xAfterBounce)
  })
})

describe('Wind - 上下の壁挙動', () => {
  it('天井に当たると上方向の速度が停止する', () => {
    const stage = [
      ['a', 'a', 'a'],
      [' ', ' ', ' '],
    ]
    const wind = new Wind(16, 20, 0, stage)
    wind.vy = -3 // 上向きに移動

    // 天井に当たるまで更新
    for (let i = 0; i < 20; i++) {
      wind.update()
    }

    // ふるまい：「天井に当たったら上昇が止まる」
    expect(wind.vy).toBeGreaterThanOrEqual(0)
  })

  it('床に当たると下方向の速度が停止する', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const wind = new Wind(16, 0, 0, stage)

    // 重力で落下して床に当たるまで更新
    for (let i = 0; i < 30; i++) {
      wind.update()
    }

    // ふるまい：「床に当たったら落下が止まる」
    expect(wind.vy).toBe(0)
  })
})

describe('Wind - 床の上で静止', () => {
  it('床の上で水平速度0の場合、振動せずに静止する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'],
    ]
    const wind = new Wind(16, 0, 0, stage)

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      wind.update()
    }

    const stableY = wind.y
    const stableVy = wind.vy

    // ふるまい：「床の上で静止すると振動しない」
    for (let i = 0; i < 100; i++) {
      wind.update()
      expect(wind.y).toBe(stableY)
      expect(wind.vy).toBe(stableVy)
    }
  })
})

describe('Wind - 重力の影響', () => {
  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const wind = new Wind(16, 0, 0, stage)

    const initialVy = wind.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      wind.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(wind.vy).toBeGreaterThan(initialVy)
  })

  it('落下中は下方向に移動する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const wind = new Wind(16, 0, 0, stage)

    const initialY = wind.y

    // 落下させる
    for (let i = 0; i < 10; i++) {
      wind.update()
    }

    // ふるまい：「落下すると下に移動する」
    expect(wind.y).toBeGreaterThan(initialY)
  })
})
