import { describe, it, expect, vi } from 'vitest'
import { CollisionReactionComponent } from './CollisionReactionComponent'
import { Entity } from '@/entity/Entity'
import { Rectangle } from '@/core/Rectangle'

describe('CollisionReactionComponent', () => {
  it('登録されたハンドラが正しく呼ばれる', () => {
    const component = new CollisionReactionComponent()
    const mockHandler = vi.fn()

    // 'wind' タグとの衝突時のハンドラを登録
    component.on('wind', mockHandler)

    // 風エンティティを作成（タグに 'wind' を含む）
    const wind = new Entity('wind', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['wind'])

    // 衝突処理
    component.handle(wind)

    // ハンドラが呼ばれたことを確認
    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(wind)
  })

  it('登録されていないタグの衝突では何も起こらない', () => {
    const component = new CollisionReactionComponent()
    const mockHandler = vi.fn()

    // 'wind' タグのみ登録
    component.on('wind', mockHandler)

    // 別のエンティティ（enemy）を作成（'enemy' タグを持つ）
    const enemy = new Entity('enemy', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['enemy'])

    // 衝突処理
    component.handle(enemy)

    // ハンドラは呼ばれない
    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('複数のハンドラを登録できる', () => {
    const component = new CollisionReactionComponent()
    const windHandler = vi.fn()
    const enemyHandler = vi.fn()

    component.on('wind', windHandler)
    component.on('enemy', enemyHandler)

    const wind = new Entity('wind', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['wind'])
    const enemy = new Entity('enemy', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['enemy'])

    // wind との衝突
    component.handle(wind)
    expect(windHandler).toHaveBeenCalledTimes(1)
    expect(enemyHandler).not.toHaveBeenCalled()

    // enemy との衝突
    component.handle(enemy)
    expect(windHandler).toHaveBeenCalledTimes(1)
    expect(enemyHandler).toHaveBeenCalledTimes(1)
  })

  it('clear() で登録されたハンドラがクリアされる', () => {
    const component = new CollisionReactionComponent()
    const mockHandler = vi.fn()

    component.on('wind', mockHandler)
    component.clear()

    const wind = new Entity('wind', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['wind'])
    component.handle(wind)

    // クリア後はハンドラが呼ばれない
    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('ハンドラ内で相手エンティティの状態を変更できる', () => {
    const component = new CollisionReactionComponent()

    // プレイヤー的なオブジェクト
    let playerVy = 0

    component.on('wind', () => {
      playerVy = -3 // WindJump
    })

    const wind = new Entity('wind', new Rectangle(0, 0, 16, 16), new Rectangle(0, 0, 16, 16), [[]], ['wind'])
    component.handle(wind)

    // vy が変更されている
    expect(playerVy).toBe(-3)
  })
})
