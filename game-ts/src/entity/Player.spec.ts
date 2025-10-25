import { describe, it, expect, beforeEach } from 'vitest'
import { Player } from './Player'
import { Input } from '@/core/Input'

/**
 * モック Input クラス
 * キー入力をシミュレート
 */
class MockInput extends Input {
  private mockKeys: Map<string, number> = new Map()

  setKey(key: string, state: number) {
    this.mockKeys.set(key, state)
  }

  override getKey(key: string): number {
    return this.mockKeys.get(key) ?? 0
  }

  override isKeyPressed(key: string): boolean {
    return this.getKey(key) === 1
  }

  override isKeyDown(key: string): boolean {
    const state = this.getKey(key)
    return state === 1 || state === 2
  }

  override update() {
    // モックでは何もしない
  }
}

describe('Player - 床の上で静止', () => {
  let input: MockInput

  beforeEach(() => {
    input = new MockInput()
  })

  it('床の上で何もしない場合、位置とy速度が安定する（振動しない）', () => {
    // シンプルな床のステージ
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'], // 床
    ]

    // プレイヤーを床の上に配置 (y=0, 床は y=16)
    const player = new Player(0, 0, stage, input)

    // 最初のフレームで床に着地するまで更新
    for (let i = 0; i < 20; i++) {
      player.update()
    }

    // 着地後の位置を記録
    const stableY = player.y
    const stableVy = player.vy

    console.log(`着地後: y=${stableY}, vy=${stableVy}`)

    // さらに100フレーム更新しても位置・速度が変わらないことを確認
    for (let i = 0; i < 100; i++) {
      player.update()
      expect(player.y).toBe(stableY)
      expect(player.vy).toBe(0)
    }
  })
})

describe('Player - ジャンプ操作', () => {
  let input: MockInput

  beforeEach(() => {
    input = new MockInput()
  })

  it('床の上で「KeyW」を押すとジャンプできる', () => {
    // シンプルな床のステージ
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'], // 床
    ]

    const player = new Player(0, 0, stage, input)

    // 床に着地するまで更新
    for (let i = 0; i < 20; i++) {
      player.update()
    }

    const beforeJumpY = player.y
    console.log(`ジャンプ前: y=${beforeJumpY}, vy=${player.vy}`)

    // 「KeyW」を押す（isKeyPressed = true になる状態は 1）
    input.setKey('KeyW', 1)
    player.update()

    console.log(`ジャンプ直後: y=${player.y}, vy=${player.vy}`)

    // ジャンプ直後、vyが負の値（上向き）になっているはず
    expect(player.vy).toBeLessThan(0)

    // 数フレーム後、yが小さく（上に移動）なっているはず
    input.setKey('KeyW', 0) // キーを離す
    for (let i = 0; i < 5; i++) {
      player.update()
    }

    console.log(`数フレーム後: y=${player.y}, vy=${player.vy}`)
    expect(player.y).toBeLessThan(beforeJumpY)
  })

  it('空中では連続してジャンプできない（コヨーテタイム切れ後）', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'], // 床
    ]

    const player = new Player(0, 0, stage, input)

    // 床に着地するまで更新
    for (let i = 0; i < 20; i++) {
      player.update()
    }

    // 1回目のジャンプ
    input.setKey('KeyW', 1)
    player.update()
    input.setKey('KeyW', 0)

    const firstJumpVy = player.vy
    expect(firstJumpVy).toBeLessThan(0)

    // コヨーテタイムが切れて落下状態になるまで十分待つ（20フレーム以上）
    for (let i = 0; i < 25; i++) {
      player.update()
    }

    // 2回目のジャンプを試みる（空中なので失敗するはず）
    const beforeSecondJumpVy = player.vy
    input.setKey('KeyW', 1)
    player.update()
    const afterSecondJumpVy = player.vy
    input.setKey('KeyW', 0)

    // ジャンプが発動していないことを確認（vyが-4になっていない）
    expect(afterSecondJumpVy).not.toBe(-4)
    // vyは継続して重力の影響を受けているはず（前フレームとの差が重力加速度程度）
    expect(Math.abs(afterSecondJumpVy - beforeSecondJumpVy)).toBeLessThan(1)
  })
})
