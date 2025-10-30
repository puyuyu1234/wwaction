import { describe, it, expect } from 'vitest'

import { Potion } from './Potion'

describe('Potion - 壁での挙動（Windとの差異）', () => {
  it('左壁に当たっても跳ね返らず停止する', () => {
    const stage = [
      ['g', ' ', ' ', ' ', ' '],
      ['g', 'a', 'a', 'a', 'g'],
    ]
    const potion = new Potion(32, 0, stage)
    potion.vx = -1 // 左向きに移動

    // 左壁に当たるまで更新
    for (let i = 0; i < 50; i++) {
      potion.update()
    }

    // ふるまい：「左壁で停止する（跳ね返らない）」
    expect(potion.vx).toBe(0)
  })

  it('右壁に当たっても跳ね返らず停止する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', 'g'],
      ['g', 'a', 'a', 'a', 'g'],
    ]
    const potion = new Potion(16, 0, stage)
    potion.vx = 1 // 右向きに移動

    // 右壁に当たるまで更新
    for (let i = 0; i < 100; i++) {
      potion.update()
    }

    // ふるまい：「右壁で停止する（跳ね返らない）」
    expect(potion.vx).toBe(0)
  })

  it('壁に当たった後は移動しない', () => {
    const stage = [
      ['g', ' ', ' ', ' ', 'g'],
      ['g', 'a', 'a', 'a', 'g'],
    ]
    const potion = new Potion(32, 0, stage)
    potion.vx = -1

    // 左壁に当たるまで更新
    for (let i = 0; i < 50; i++) {
      potion.update()
    }
    expect(potion.vx).toBe(0)

    const xAfterStop = potion.x

    // さらに更新を続ける
    for (let i = 0; i < 50; i++) {
      potion.update()
    }

    // ふるまい：「停止後は動かない」
    expect(potion.x).toBe(xAfterStop)
  })
})

describe('Potion - 上下の壁挙動', () => {
  it('天井に当たると上方向の速度が停止する', () => {
    const stage = [
      ['g', 'g', 'g'],
      [' ', ' ', ' '],
    ]
    const potion = new Potion(16, 20, stage)
    potion.vy = -3 // 上向きに移動

    // 天井に当たるまで更新
    for (let i = 0; i < 20; i++) {
      potion.update()
    }

    // ふるまい：「天井に当たったら上昇が止まる」
    expect(potion.vy).toBeGreaterThanOrEqual(0)
  })

  it('床に当たると下方向の速度が停止する', () => {
    const stage = [
      [' ', ' ', ' '],
      ['g', 'a', 'g'],
    ]
    const potion = new Potion(16, 0, stage)

    // 重力で落下して床に当たるまで更新
    for (let i = 0; i < 30; i++) {
      potion.update()
    }

    // ふるまい：「床に当たったら落下が止まる」
    expect(potion.vy).toBe(0)
  })
})

describe('Potion - 床の上で静止', () => {
  it('床の上では完全に静止する（上下左右とも動かない）', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['g', 'a', 'a', 'a', 'g'],
    ]
    const potion = new Potion(32, 0, stage)

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      potion.update()
    }

    const stableX = potion.x
    const stableY = potion.y

    // ふるまい：「床の上では完全に静止する」
    for (let i = 0; i < 100; i++) {
      potion.update()
      expect(potion.x).toBe(stableX)
      expect(potion.y).toBe(stableY)
      expect(potion.vx).toBe(0)
      expect(potion.vy).toBe(0)
    }
  })
})

describe('Potion - 重力の影響', () => {
  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const potion = new Potion(16, 0, stage)

    const initialVy = potion.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      potion.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(potion.vy).toBeGreaterThan(initialVy)
  })

  it('落下中は下方向に移動する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const potion = new Potion(16, 0, stage)

    const initialY = potion.y

    // 落下させる
    for (let i = 0; i < 10; i++) {
      potion.update()
    }

    // ふるまい：「落下すると下に移動する」
    expect(potion.y).toBeGreaterThan(initialY)
  })
})

describe('Potion - タグ確認', () => {
  it('healingタグを持つ（Playerに回復効果を与える）', () => {
    const stage = [[' ']]
    const potion = new Potion(0, 0, stage)

    // ふるまい：「healingタグを持つ」
    expect(potion.hasTag('healing')).toBe(true)
  })

  it('他のタグは持たない', () => {
    const stage = [[' ']]
    const potion = new Potion(0, 0, stage)

    // ふるまい：「healing以外のタグは持たない」
    expect(potion.hasTag('enemy')).toBe(false)
    expect(potion.hasTag('wind')).toBe(false)
    expect(potion.hasTag('player')).toBe(false)
  })
})
