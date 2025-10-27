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
    const player = new Player(0, 0, stage, input, 5, 5)

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

    const player = new Player(0, 0, stage, input, 5, 5)

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

    const player = new Player(0, 0, stage, input, 5, 5)

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

describe('Player - HP/ダメージシステム', () => {
  let input: MockInput

  beforeEach(() => {
    input = new MockInput()
  })

  it('初期HPが正しく設定される', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 5, 10)

    expect(player.hp).toBe(5)
    expect(player.maxHp).toBe(10)
    expect(player.isDead).toBe(false)
  })


  it('ダメージを受けるとHPが減少する', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 5, 5)

    player.damage(2)

    expect(player.hp).toBe(3)
    expect(player.isDead).toBe(false)
  })

  it('HPが0になると死亡状態になる', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 3, 5)

    player.damage(3)

    expect(player.hp).toBe(0)
    expect(player.isDead).toBe(true)
  })

  it('HPが0未満にはならない', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 3, 5)

    player.damage(10) // 大ダメージ

    expect(player.hp).toBe(0) // 負の値にならない
    expect(player.isDead).toBe(true)
  })

  it('死亡後はupdateが実行されない', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'],
    ]
    const player = new Player(0, 0, stage, input, 1, 5)

    // 床に着地させる
    for (let i = 0; i < 20; i++) {
      player.update()
    }

    const beforeY = player.y

    // 致命傷を与える
    player.damage(1)
    expect(player.isDead).toBe(true)

    // 重力でキーを押しても動かない
    input.setKey('KeyD', 1)
    for (let i = 0; i < 10; i++) {
      player.update()
    }

    // 位置が変わらないことを確認（updateが動作していない）
    expect(player.y).toBe(beforeY)
  })

  it('回復するとHPが増加する', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 3, 5)

    player.heal(2)

    expect(player.hp).toBe(5)
  })

  it('回復してもmaxHpを超えない', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 4, 5)

    player.heal(5) // 大回復

    expect(player.hp).toBe(5) // maxHpで止まる
  })

  it('ダメージを受けると無敵時間が発生し、連続ダメージを受けない', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 5, 5)

    // 1回目のダメージ
    player.damage(1)
    expect(player.hp).toBe(4)
    expect(player.isInvincible()).toBe(true)

    // 無敵時間中は2回目のダメージを受けない
    player.damage(1)
    expect(player.hp).toBe(4) // 変わらない

    player.damage(10) // 大ダメージでも受けない
    expect(player.hp).toBe(4)
  })

  it('無敵時間が切れるとまたダメージを受けられる', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 5, 5)

    // 1回目のダメージ
    player.damage(1)
    expect(player.hp).toBe(4)

    // 51フレーム待つ（無敵時間50フレーム + 1）
    for (let i = 0; i < 51; i++) {
      player.update()
    }

    expect(player.isInvincible()).toBe(false)

    // 2回目のダメージが入る
    player.damage(1)
    expect(player.hp).toBe(3)
  })

  it('ダメージを受けるとノックバックする', () => {
    const stage = [[' ']]
    const player = new Player(0, 0, stage, input, 5, 5)

    player.vx = 2 // 右に移動中

    player.damage(1)

    // 左にノックバック
    expect(player.vx).toBe(-1)
  })
})
