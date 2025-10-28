import { describe, it, expect } from 'vitest'

import { Gurasan } from './Gurasan'

describe('Gurasan - 左右の壁反転', () => {
  it('左壁に当たると右向きに移動を開始する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(64, 0, stage)

    // 左向きに移動して壁に当たるまで（初期速度は -0.5）
    for (let i = 0; i < 200; i++) {
      gurasan.update()
      if (gurasan.vx > 0) break // 反転したら終了
    }

    // ふるまい：「左壁で右向きに反転する」
    expect(gurasan.vx).toBeGreaterThan(0)
  })

  it('右壁に当たると左向きに移動を開始する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(16, 0, stage)
    gurasan.vx = 0.5 // 右向きに変更

    // 右向きに移動して壁に当たるまで
    for (let i = 0; i < 200; i++) {
      gurasan.update()
      if (gurasan.vx < 0) break // 反転したら終了
    }

    // ふるまい：「右壁で左向きに反転する」
    expect(gurasan.vx).toBeLessThan(0)
  })
})

describe('Gurasan - 風との衝突で分裂', () => {
  it('風に触れると分裂イベントを発火する', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(16, 0, stage)

    // spawnイベントとdestroyイベントを監視
    const spawnEvents: any[] = []
    gurasan.on('spawn', (entity: any) => {
      spawnEvents.push(entity)
    })

    let destroyFired = false
    gurasan.on('destroy', () => {
      destroyFired = true
    })

    // 風エンティティとの衝突を模擬
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    gurasan.handleCollision(mockWind as any)

    // ふるまい：「風との衝突でspawnイベントが2回（Nasake + SunGlass）発火する」
    expect(spawnEvents.length).toBe(2)

    // ふるまい：「destroyイベントが発火する」
    expect(destroyFired).toBe(true)
  })

  it('風に触れると Nasake と SunGlass を生成する', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(32, 0, stage)

    // spawnイベントで生成されたエンティティを記録
    const spawnedEntities: any[] = []
    gurasan.on('spawn', (entity: any) => {
      spawnedEntities.push(entity)
    })

    // 風との衝突を発生させる
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    gurasan.handleCollision(mockWind as any)

    // ふるまい：「生成されるのは Nasake と SunGlass」
    expect(spawnedEntities.length).toBe(2)

    // 生成されたエンティティの名前を確認
    const entityNames = spawnedEntities.map((e) => e.imageKey)
    expect(entityNames).toContain('nasake')
    expect(entityNames).toContain('sunglass')
  })

  it('風に触れる前は分裂しない', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(16, 0, stage)

    let spawnCount = 0
    gurasan.on('spawn', () => {
      spawnCount++
    })

    // 数フレーム更新（風との衝突なし）
    for (let i = 0; i < 20; i++) {
      gurasan.update()
    }

    // ふるまい：「風に触れない限り分裂しない」
    expect(spawnCount).toBe(0)
  })
})

describe('Gurasan - タグ確認', () => {
  it('敵タグを持つ（プレイヤーにダメージを与える）', () => {
    const stage = [[' ']]
    const gurasan = new Gurasan(0, 0, stage)

    // ふるまい：「enemyタグを持つ」
    expect(gurasan.hasTag('enemy')).toBe(true)
  })

  it('風タグは持たない', () => {
    const stage = [[' ']]
    const gurasan = new Gurasan(0, 0, stage)

    // ふるまい：「windタグは持たない」
    expect(gurasan.hasTag('wind')).toBe(false)
  })
})

describe('Gurasan - 重力と床の挙動', () => {
  it('床の上では上下に振動せず安定する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const gurasan = new Gurasan(32, 0, stage)

    // 着地するまで更新
    for (let i = 0; i < 20; i++) {
      gurasan.update()
    }

    const floorY = gurasan.y

    // ふるまい：「床の上ではy座標が安定する」
    for (let i = 0; i < 50; i++) {
      gurasan.update()
      expect(gurasan.y).toBe(floorY)
      expect(gurasan.vy).toBe(0)
    }
  })

  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const gurasan = new Gurasan(16, 0, stage)

    const initialVy = gurasan.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      gurasan.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(gurasan.vy).toBeGreaterThan(initialVy)
  })
})
