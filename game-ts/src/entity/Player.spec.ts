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
