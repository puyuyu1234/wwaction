import { describe, it, expect } from 'vitest'

import { Nasake } from './Nasake'

describe('Nasake - 左右の壁反転', () => {
  it('左壁に当たると右向きに移動を開始する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nasake = new Nasake(64, 0, stage)

    // 左向きに移動して壁に当たるまで（初期速度は -0.25）
    for (let i = 0; i < 300; i++) {
      nasake.update()
      if (nasake.vx > 0) break // 反転したら終了
    }

    // ふるまい：「左壁で右向きに反転する」
    expect(nasake.vx).toBeGreaterThan(0)
  })

  it('右壁に当たると左向きに移動を開始する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nasake = new Nasake(16, 0, stage)
    nasake.vx = 0.5 // 右向きに変更

    // 右向きに移動して壁に当たるまで
    for (let i = 0; i < 200; i++) {
      nasake.update()
      if (nasake.vx < 0) break // 反転したら終了
    }

    // ふるまい：「右壁で左向きに反転する」
    expect(nasake.vx).toBeLessThan(0)
  })

  it('壁で反転した後も継続して移動する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nasake = new Nasake(80, 0, stage)

    // 左壁で反転するまで
    for (let i = 0; i < 400; i++) {
      nasake.update()
      if (nasake.vx > 0) break
    }
    expect(nasake.vx).toBeGreaterThan(0)

    const xAfterBounce = nasake.x

    // さらに移動を続ける
    for (let i = 0; i < 20; i++) {
      nasake.update()
    }

    // ふるまい：「反転後も移動し続ける」
    expect(nasake.x).toBeGreaterThan(xAfterBounce)
  })
})

describe('Nasake - 風との衝突反応', () => {
  it('風に触れると上方向に跳ねる', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const nasake = new Nasake(16, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      nasake.update()
    }

    const beforeY = nasake.y

    // 風エンティティを模擬（handleCollisionを直接呼ぶ）
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    nasake.handleCollision(mockWind as any)

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      nasake.update()
    }

    // ふるまい：「風に触れたら上に移動する」
    expect(nasake.y).toBeLessThan(beforeY)
  })

  it('風に触れると上方向の速度を持つ', () => {
    const stage = [[' ', ' ', ' ']]
    const nasake = new Nasake(16, 16, stage)

    // 風との衝突を発生させる
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    nasake.handleCollision(mockWind as any)

    // ふるまい：「風との衝突で上向きの速度を得る」
    expect(nasake.vy).toBeLessThan(0)
  })

  it('風以外のエンティティとの衝突では反応しない', () => {
    const stage = [[' ', ' ', ' ']]
    const nasake = new Nasake(16, 16, stage)

    const initialVy = nasake.vy

    // 風以外のエンティティを模擬
    const mockOther = {
      hasTag: (tag: string) => tag === 'player',
      tags: ['player'],
    }
    nasake.handleCollision(mockOther as any)

    // ふるまい：「風以外では速度が変化しない」
    expect(nasake.vy).toBe(initialVy)
  })
})

describe('Nasake - 重力と床の挙動', () => {
  it('床の上では上下に振動せず安定する', () => {
    // 左右に壁を配置（Nasakeが壁で跳ね返りながら巡回する）
    const stage = [
      ['a', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nasake = new Nasake(32, 0, stage)

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      nasake.update()
    }

    const floorY = nasake.y

    // ふるまい：「床の上ではy座標が安定する（Player と同じ）」
    for (let i = 0; i < 100; i++) {
      nasake.update()
      expect(nasake.y).toBe(floorY)
      expect(nasake.vy).toBe(0)
    }
  })

  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const nasake = new Nasake(16, 0, stage)

    const initialVy = nasake.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      nasake.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(nasake.vy).toBeGreaterThan(initialVy)
  })
})

describe('Nasake - タグ確認', () => {
  it('敵タグを持たない（ダメージを与えない）', () => {
    const stage = [[' ']]
    const nasake = new Nasake(0, 0, stage)

    // ふるまい：「enemyタグを持たない」
    expect(nasake.hasTag('enemy')).toBe(false)
  })

  it('特定のタグを持たない（将来の拡張に備えて確認）', () => {
    const stage = [[' ']]
    const nasake = new Nasake(0, 0, stage)

    // ふるまい：「現状はどのタグも持たない」
    expect(nasake.hasTag('wind')).toBe(false)
    expect(nasake.hasTag('player')).toBe(false)
    expect(nasake.hasTag('healing')).toBe(false)
  })
})
