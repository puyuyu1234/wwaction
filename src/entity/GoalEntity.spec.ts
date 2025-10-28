import { describe, it, expect } from 'vitest'

import { GoalEntity } from './GoalEntity'
import { Player } from './Player'

import { Input } from '@/core/Input'
import { Rectangle } from '@/core/Rectangle'

describe('GoalEntity - 基本動作', () => {
  it('指定した矩形領域を持つ', () => {
    const rect = new Rectangle(100, 50, 32, 32)
    const goal = new GoalEntity(rect)

    // ふるまい：「指定した矩形領域をcurrentHitboxとして持つ」
    expect(goal.currentHitbox.x).toBe(100)
    expect(goal.currentHitbox.y).toBe(50)
    expect(goal.currentHitbox.width).toBe(32)
    expect(goal.currentHitbox.height).toBe(32)
  })

  it('goalタグを持つ', () => {
    const goal = new GoalEntity(new Rectangle(0, 0, 16, 16))

    // ふるまい：「goalタグを持つ」
    expect(goal.hasTag('goal')).toBe(true)
  })

  it('update()を呼んでも位置が変わらない（物理演算なし）', () => {
    const goal = new GoalEntity(new Rectangle(50, 50, 16, 16))
    const initialX = goal.x
    const initialY = goal.y

    // 数フレーム更新
    for (let i = 0; i < 10; i++) {
      goal.update()
    }

    // ふるまい：「update()を呼んでも位置が変わらない」
    expect(goal.x).toBe(initialX)
    expect(goal.y).toBe(initialY)
  })

  it('速度を持たない（vx, vy は常に0）', () => {
    const goal = new GoalEntity(new Rectangle(0, 0, 16, 16))

    goal.update()
    goal.update()
    goal.update()

    // ふるまい：「速度を持たない」
    expect(goal.vx).toBe(0)
    expect(goal.vy).toBe(0)
  })
})

describe('Player - ゴールとの衝突', () => {
  it('ゴールに触れると nextStage イベントが発火する', () => {
    const stage = [[' ', ' '], [' ', ' ']]
    const input = new Input()
    const player = new Player(0, 0, stage, input, 3, 3)

    let eventFired = false
    player.on('nextStage', () => {
      eventFired = true
    })

    // ゴールエンティティを模擬
    const mockGoal = {
      hasTag: (tag: string) => tag === 'goal',
      tags: ['goal'],
    }
    player.handleCollision(mockGoal as any)

    // ふるまい：「ゴールに触れると nextStage イベントが発火する」
    expect(eventFired).toBe(true)
  })

  it('ゴール以外のエンティティでは nextStage イベントが発火しない', () => {
    const stage = [[' ', ' '], [' ', ' ']]
    const input = new Input()
    const player = new Player(0, 0, stage, input, 3, 3)

    let eventFired = false
    player.on('nextStage', () => {
      eventFired = true
    })

    // 風エンティティを模擬（ゴールではない）
    const mockWind = {
      hasTag: (tag: string) => tag === 'wind',
      tags: ['wind'],
    }
    player.handleCollision(mockWind as any)

    // ふるまい：「ゴール以外では nextStage イベントが発火しない」
    expect(eventFired).toBe(false)
  })
})

describe('GoalEntity - タグ確認', () => {
  it('goalタグのみを持つ', () => {
    const goal = new GoalEntity(new Rectangle(0, 0, 16, 16))

    // ふるまい：「goalタグを持つ」
    expect(goal.hasTag('goal')).toBe(true)

    // ふるまい：「他のタグは持たない」
    expect(goal.hasTag('enemy')).toBe(false)
    expect(goal.hasTag('wind')).toBe(false)
    expect(goal.hasTag('healing')).toBe(false)
  })
})
