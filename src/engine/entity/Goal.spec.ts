import { describe, it, expect } from 'vitest'

import { Goal } from './Goal'
import { Player } from './Player'

import { Input } from '@/engine/core/Input'
import { Rectangle } from '@/engine/core/Rectangle'

describe('Goal - ゴールエンティティ', () => {
  it('プレイヤーと衝突するとnextStageイベントが発火する', () => {
    const stage = [
      [' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' '],
      ['a', 'a', 'a', 'a', 'a'],
    ]
    const stageWidth = stage[0].length * 16
    const stageHeight = stage.length * 16

    // ゴールをステージ右端に配置
    const goalRect = new Rectangle(stageWidth - 1, 0, 3, stageHeight)
    const goal = new Goal(goalRect, stage)

    // プレイヤーをゴール近くに配置
    const input = new Input()
    const player = new Player(stageWidth - 20 + 12, 16 + 16, stage, input, 3, 3)

    // nextStageイベントが発火したかを記録
    let nextStageEventFired = false
    player.on('nextStage', () => {
      nextStageEventFired = true
    })

    // プレイヤーをゴールの位置まで移動
    player.x = stageWidth - 1

    // 衝突判定を実行
    if (player.currentHitbox.hitTest(goal.currentHitbox)) {
      player.handleCollision(goal)
    }

    // nextStageイベントが発火したことを確認
    expect(nextStageEventFired).toBe(true)
  })
})
