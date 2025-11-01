import { describe, it, expect } from 'vitest'

import { Nuefu } from './Nuefu'

describe('Nuefu - 左右の壁反転', () => {
  it('左壁に当たると右向きに移動を開始する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nuefu = new Nuefu(64, 0, stage)

    // 左向きに移動して壁に当たるまで（初期速度は -0.5）
    for (let i = 0; i < 150; i++) {
      nuefu.update()
      if (nuefu.vx > 0) break // 反転したら終了
    }

    // ふるまい：「左壁で右向きに反転する」
    expect(nuefu.vx).toBeGreaterThan(0)
  })

  it('右壁に当たると左向きに移動を開始する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nuefu = new Nuefu(16, 0, stage)
    nuefu.vx = 0.5 // 右向きに変更

    // 右向きに移動して壁に当たるまで
    for (let i = 0; i < 200; i++) {
      nuefu.update()
      if (nuefu.vx < 0) break // 反転したら終了
    }

    // ふるまい：「右壁で左向きに反転する」
    expect(nuefu.vx).toBeLessThan(0)
  })
})

describe('Nuefu - 崖判定（Nasakeとの差異）', () => {
  it('右側が崖なら左向きに方向転換する（落ちない）', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', ' ', ' ', ' '], // x=64から右が崖
    ]
    const nuefu = new Nuefu(16, 0, stage)
    nuefu.vx = 0.5 // 右向き

    // 床に着地するまで待つ
    for (let i = 0; i < 30; i++) {
      nuefu.update()
    }

    const floorY = nuefu.y

    // 崖に到達するまで更新
    for (let i = 0; i < 200; i++) {
      nuefu.update()
      if (nuefu.vx < 0) break // 方向転換したら終了
    }

    // ふるまい：「崖で方向転換する」
    expect(nuefu.vx).toBeLessThan(0)

    // ふるまい：「崖から落ちていない（床の高さを維持）」
    expect(nuefu.y).toBe(floorY)
  })

  it('左側が崖なら右向きに方向転換する（落ちない）', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', 'a', 'a', 'a', 'a'], // x=48から左が崖
    ]
    const nuefu = new Nuefu(64, 0, stage)
    nuefu.vx = -0.5 // 左向き

    // 床に着地するまで待つ
    for (let i = 0; i < 30; i++) {
      nuefu.update()
    }

    const floorY = nuefu.y

    // 崖に到達するまで更新
    for (let i = 0; i < 200; i++) {
      nuefu.update()
      if (nuefu.vx > 0) break // 方向転換したら終了
    }

    // ふるまい：「崖で方向転換する」
    expect(nuefu.vx).toBeGreaterThan(0)

    // ふるまい：「崖から落ちていない（床の高さを維持）」
    expect(nuefu.y).toBe(floorY)
  })

  it('崖がない平坦な床では端まで直進する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'], // 平坦な床、崖なし
    ]
    const nuefu = new Nuefu(48, 0, stage)
    nuefu.vx = -0.5 // 左向き

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      nuefu.update()
    }

    const initialX = nuefu.x

    // 壁に当たるまで更新（崖判定では止まらない）
    for (let i = 0; i < 100; i++) {
      nuefu.update()
      if (nuefu.vx > 0) break // 壁で反転したら終了
    }

    // ふるまい：「平坦な床では崖判定で止まらず、壁まで到達する」
    expect(nuefu.x).toBeLessThan(initialX) // 左に進んだ
    expect(nuefu.vx).toBeGreaterThan(0) // 左壁で反転した（崖判定ではない）
  })
})

describe('Nuefu - 風との衝突反応', () => {
  it('風に触れると上方向に跳ねる', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const nuefu = new Nuefu(16, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      nuefu.update()
    }

    const beforeY = nuefu.y

    // 風エンティティを模擬
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    nuefu.handleCollision(mockWind as any)

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      nuefu.update()
    }

    // ふるまい：「風に触れたら上に移動する」
    expect(nuefu.y).toBeLessThan(beforeY)
  })

  it('風に触れると上方向の速度を持つ', () => {
    const stage = [[' ', ' ', ' ']]
    const nuefu = new Nuefu(16, 16, stage)

    // 風との衝突を発生させる
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    nuefu.handleCollision(mockWind as any)

    // ふるまい：「風との衝突で上向きの速度を得る」
    expect(nuefu.vy).toBeLessThan(0)
  })

  it('風以外のエンティティとの衝突では反応しない', () => {
    const stage = [[' ', ' ', ' ']]
    const nuefu = new Nuefu(16, 16, stage)

    const initialVy = nuefu.vy

    // 風以外のエンティティを模擬
    const mockOther = {
      hasTag: (tag: string) => tag === 'player',
      tags: ['player'],
    }
    nuefu.handleCollision(mockOther as any)

    // ふるまい：「風以外では速度が変化しない」
    expect(nuefu.vy).toBe(initialVy)
  })
})

describe('Nuefu - 重力と床の挙動', () => {
  it('床の上では上下に振動せず安定する', () => {
    // 左右に壁を配置（Nuefuが壁で跳ね返りながら巡回する）
    const stage = [
      ['a', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const nuefu = new Nuefu(32, 0, stage)

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      nuefu.update()
    }

    const floorY = nuefu.y

    // ふるまい：「床の上ではy座標が安定する」
    for (let i = 0; i < 100; i++) {
      nuefu.update()
      expect(nuefu.y).toBe(floorY)
      expect(nuefu.vy).toBe(0)
    }
  })

  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const nuefu = new Nuefu(16, 0, stage)

    const initialVy = nuefu.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      nuefu.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(nuefu.vy).toBeGreaterThan(initialVy)
  })
})

describe('Nuefu - タグ確認', () => {
  it('敵タグを持つ（Playerにダメージを与える）', () => {
    const stage = [[' ']]
    const nuefu = new Nuefu(0, 0, stage)

    // ふるまい：「enemyタグを持つ」
    expect(nuefu.hasTag('enemy')).toBe(true)
  })

  it('他のタグは持たない', () => {
    const stage = [[' ']]
    const nuefu = new Nuefu(0, 0, stage)

    // ふるまい：「enemy以外のタグは持たない」
    expect(nuefu.hasTag('wind')).toBe(false)
    expect(nuefu.hasTag('player')).toBe(false)
    expect(nuefu.hasTag('healing')).toBe(false)
  })
})
