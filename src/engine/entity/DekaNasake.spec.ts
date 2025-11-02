import { describe, it, expect } from 'vitest'

import { DekaNasake } from './DekaNasake'

describe('DekaNasake - 左右の壁反転', () => {
  it('左壁に当たると右向きに移動を開始する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(80, 16, stage)

    // 左向きに移動して壁に当たるまで（初期速度は -0.75）
    for (let i = 0; i < 300; i++) {
      deka.update()
      if (deka.vx > 0) break // 反転したら終了
    }

    // ふるまい：「左壁で右向きに反転する」
    expect(deka.vx).toBeGreaterThan(0)
  })

  it('右壁に当たると左向きに移動を開始する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      [' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(16, 16, stage)

    // 右向きに移動して壁に当たるまで
    for (let i = 0; i < 200; i++) {
      deka.update()
      if (deka.vx < 0) break // 反転したら終了
    }

    // ふるまい：「右壁で左向きに反転する」
    expect(deka.vx).toBeLessThan(0)
  })

  it('壁で反転した後も継続して移動する', () => {
    const stage = [
      ['a', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'a'],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(80, 16, stage)

    // 左壁で反転するまで
    for (let i = 0; i < 400; i++) {
      deka.update()
      if (deka.vx > 0) break
    }
    expect(deka.vx).toBeGreaterThan(0)

    const xAfterBounce = deka.x

    // さらに移動を続ける
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // ふるまい：「反転後も移動し続ける」
    expect(deka.x).toBeGreaterThan(xAfterBounce)
  })
})

describe('DekaNasake - 風との衝突反応', () => {
  it('風に触れると風の速度を奪う', () => {
    const stage = [
      [' ', ' ', ' '],
      ['a', 'a', 'a'],
    ]
    const deka = new DekaNasake(16, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // 風エンティティを模擬（handleCollisionを直接呼ぶ）
    const mockWind = {
      vx: 5,
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    deka.handleCollision(mockWind as any)

    // ふるまい：「風の速度を奪って自分のvxに設定する」
    expect(deka.vx).toBe(5)
    // ふるまい：「風の速度を逆向きにする」
    expect(mockWind.vx).toBe(-5)
  })

  it('風に触れた後、12フレーム待機してから逃走する', () => {
    // 壁のない広いステージ
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(80, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // 風との衝突を発生させる
    const mockWind = {
      vx: 3,
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    deka.handleCollision(mockWind as any)

    // hitWind状態に遷移している（速度は風から奪った3）
    expect(deka.vx).toBe(3)

    // 12フレーム待機（hitWind状態の間、vxは維持される）
    // ただし、壁に当たった場合は反転する（legacy実装に準拠）
    for (let i = 0; i < 12; i++) {
      deka.update()
    }

    // 13フレーム目にrun状態に遷移
    deka.update()

    // ふるまい：「12フレーム後にrun状態に遷移し、元の方向に高速移動を開始する」
    // run状態では direction * 1.0 の速度になる
    // direction = -1（初期値）なので、vx = -1.0 になる
    expect(deka.vx).toBeCloseTo(-1.0, 1)
  })

  it('逃走状態は24フレーム継続する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(48, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // 風との衝突を発生させる
    const mockWind = {
      vx: 2,
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    deka.handleCollision(mockWind as any)

    // 12フレーム待機（hitWind状態）
    for (let i = 0; i < 12; i++) {
      deka.update()
    }

    // 13フレーム目にrun状態に遷移
    deka.update()

    // run状態の速度を確認
    const runSpeed = Math.abs(deka.vx)
    expect(runSpeed).toBeCloseTo(1.0, 1)

    // 24フレーム逃走（run状態のstateTimeが24になるまで）
    for (let i = 0; i < 23; i++) {
      deka.update()
      // 逃走中は速度が維持される
      expect(Math.abs(deka.vx)).toBeCloseTo(runSpeed, 1)
    }

    // 25フレーム目（run状態のstateTime=24）で通常移動に戻る
    deka.update()

    // ふるまい：「24フレーム後にwalk状態に戻り、ゆっくり移動する」
    expect(Math.abs(deka.vx)).toBeCloseTo(0.75, 1)
  })

  it('左に歩いているときに右に飛ばされても、元の左方向に逃走する', () => {
    // 壁のない広いステージ
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(80, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // ボスは初期状態で左に歩いている（direction = -1）
    expect(deka.vx).toBeCloseTo(-0.75) // 左向き

    // 右向きの風との衝突を発生させる
    const mockWind = {
      vx: 5, // 右向き
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    deka.handleCollision(mockWind as any)

    // hitWind状態：風の速度を奪って右に飛ぶ
    expect(deka.vx).toBe(5)

    // 12フレーム待機してrun状態に遷移
    for (let i = 0; i < 12; i++) {
      deka.update()
    }
    deka.update() // run状態へ遷移

    // ふるまい：「元の方向（左）に逃走する」
    // direction = -1 が保持されているので、vx = -1 になるはず
    expect(deka.vx).toBe(-1) // 左向きに逃走
  })

  it('右に歩いているときに左に飛ばされても、元の右方向に逃走する', () => {
    // 壁のない広いステージ
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    const deka = new DekaNasake(80, 0, stage)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      deka.update()
    }

    // ボスを右向きに変える（壁で反転させる）
    // 左壁に当たるまで移動
    for (let i = 0; i < 100; i++) {
      deka.update()
      if (deka.vx > 0) break // 右向きになったら停止
    }

    // 右向きに歩いている
    expect(deka.vx).toBeCloseTo(0.75) // 右向き

    // 左向きの風との衝突を発生させる
    const mockWind = {
      vx: -5, // 左向き
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    deka.handleCollision(mockWind as any)

    // hitWind状態：風の速度を奪って左に飛ぶ
    expect(deka.vx).toBe(-5)

    // 12フレーム待機してrun状態に遷移
    for (let i = 0; i < 12; i++) {
      deka.update()
    }
    deka.update() // run状態へ遷移

    // ふるまい：「元の方向（右）に逃走する」
    // direction = 1 が保持されているので、vx = 1 になるはず
    expect(deka.vx).toBe(1) // 右向きに逃走
  })
})

// 崖検出のテストは、TilemapCollisionComponentに
// checkLeftFootOnCliff / checkRightFootOnCliff が実装された後に追加する
// describe('DekaNasake - 崖検出', () => { ... })

describe('DekaNasake - 重力と床の挙動', () => {
  it('床の上では上下に振動せず安定する', () => {
    // 壁のない広いステージ（32x32のスプライトが十分移動できる広さ）
    const stage = [
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ]
    // 初期座標を16pxグリッドに合わせる: (64, 16) → 中心 (80, 32)
    const deka = new DekaNasake(64, 16, stage)

    // 着地するまで更新（vyが0になるまで）
    for (let i = 0; i < 100; i++) {
      deka.update()
      if (deka.vy === 0) break
    }

    const floorY = deka.y

    // ふるまい：「床の上ではy座標が安定する」
    for (let i = 0; i < 100; i++) {
      deka.update()
      expect(deka.y).toBe(floorY)
      expect(deka.vy).toBe(0)
    }
  })

  it('何もない空間では下方向に加速する', () => {
    const stage = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
      [' ', ' ', ' '],
    ]
    const deka = new DekaNasake(16, 16, stage)

    const initialVy = deka.vy

    // 数フレーム更新
    for (let i = 0; i < 5; i++) {
      deka.update()
    }

    // ふるまい：「重力により下方向に加速する」
    expect(deka.vy).toBeGreaterThan(initialVy)
  })
})

describe('DekaNasake - タグ確認', () => {
  it('enemyタグを持つ（プレイヤーにダメージを与える）', () => {
    const stage = [[' ']]
    const deka = new DekaNasake(0, 0, stage)

    // ふるまい：「enemyタグを持つ」
    expect(deka.hasTag('enemy')).toBe(true)
  })

  it('windタグは持たない', () => {
    const stage = [[' ']]
    const deka = new DekaNasake(0, 0, stage)

    // ふるまい：「windタグは持たない」
    expect(deka.hasTag('wind')).toBe(false)
  })
})
