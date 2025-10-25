import { describe, it, expect } from 'vitest'
import { TilemapCollisionComponent } from './TilemapCollisionComponent'
import { Rectangle } from '@/core/Rectangle'

describe('TilemapCollisionComponent', () => {
  describe('左壁の衝突判定', () => {
    it('左壁を検出する', () => {
      const stage = [
        ['a', ' ', ' '], // 'a' = PLATFORM
      ]
      const entity = {
        x: 16,
        y: 0,
        vx: -5,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      expect(collision.checkLeftWall()).toBe(true)
    })

    it('左壁で停止する', () => {
      const stage = [['a', ' ', ' ']]
      const entity = {
        x: 20,
        y: 0,
        vx: -10,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.stopAtLeftWall()

      expect(entity.x).toBe(16) // 壁の右側に位置調整
      expect(entity.vx).toBe(0)
    })

    it('左壁で跳ね返る', () => {
      const stage = [['a', ' ', ' ']]
      const entity = {
        x: 18,
        y: 0,
        vx: -3,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.bounceAtLeftWall()

      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(3) // 反転
    })

    it('左壁に配置後、速度0では左壁衝突判定に引っかからない', () => {
      const stage = [
        ['a', ' ', ' '], // 左壁 (x=0-15)
      ]
      const entity = {
        x: 18,
        y: 0,
        vx: -5,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 左壁衝突をチェック
      const hitLeftWall = collision.checkLeftWall()
      expect(hitLeftWall).toBe(true)

      // 左壁に衝突したので停止処理
      if (hitLeftWall) {
        collision.stopAtLeftWall()
      }

      // 停止後は速度0、位置は x=16 に配置されている
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 次フレームで左壁判定を再度チェック（速度0なので衝突しない）
      const hitLeftWallAgain = collision.checkLeftWall()
      expect(hitLeftWallAgain).toBe(false)
    })

    it('左壁に配置後、左向き速度があれば左壁衝突判定に引っかかる', () => {
      const stage = [
        ['a', ' ', ' '], // 左壁 (x=0-15)
      ]
      const entity = {
        x: 18,
        y: 0,
        vx: -5,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 左壁で停止
      const hitLeftWall = collision.checkLeftWall()
      expect(hitLeftWall).toBe(true)
      if (hitLeftWall) {
        collision.stopAtLeftWall()
      }
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 左向きに微小な速度を与える
      entity.vx = -0.125

      // 次フレームで左壁判定を再度チェック（左向きなので衝突する）
      const hitLeftWallAgain = collision.checkLeftWall()
      expect(hitLeftWallAgain).toBe(true)
    })

    it('左壁に配置後、右向き速度があれば左壁衝突判定に引っかからない', () => {
      const stage = [
        ['a', ' ', ' '], // 左壁 (x=0-15)
      ]
      const entity = {
        x: 18,
        y: 0,
        vx: -5,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 左壁で停止
      const hitLeftWall = collision.checkLeftWall()
      expect(hitLeftWall).toBe(true)
      if (hitLeftWall) {
        collision.stopAtLeftWall()
      }
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 右向きに微小な速度を与える
      entity.vx = 0.125

      // 次フレームで左壁判定を再度チェック（右向きなので衝突しない）
      const hitLeftWallAgain = collision.checkLeftWall()
      expect(hitLeftWallAgain).toBe(false)
    })
  })

  describe('右壁の衝突判定', () => {
    it('右壁を検出する', () => {
      const stage = [[' ', ' ', 'a']]
      const entity = {
        x: 16,
        y: 0,
        vx: 5,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      expect(collision.checkRightWall()).toBe(true)
    })

    it('右壁で停止する', () => {
      const stage = [[' ', ' ', 'a']]
      const entity = {
        x: 16,
        y: 0,
        vx: 10,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.stopAtRightWall()

      expect(entity.x).toBe(16) // 壁の左側に位置調整
      expect(entity.vx).toBe(0)
    })

    it('右壁で跳ね返る', () => {
      const stage = [[' ', ' ', 'a']]
      const entity = {
        x: 16,
        y: 0,
        vx: 2,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.bounceAtRightWall()

      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(-2) // 反転
    })

    it('右壁に配置後、速度0でも右壁衝突判定に引っかかるが位置は変わらない', () => {
      const stage = [
        [' ', ' ', 'a'], // 右壁 (x=32-47)
      ]
      const entity = {
        x: 16,
        y: 0,
        vx: 10,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 右壁衝突をチェック
      const hitRightWall = collision.checkRightWall()
      expect(hitRightWall).toBe(true)

      // 右壁に衝突したので停止処理
      if (hitRightWall) {
        collision.stopAtRightWall()
      }

      // 停止後は速度0、位置は x=16 に配置されている
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 次フレームで右壁判定を再度チェック（速度0でも衝突を検出する）
      const hitRightWallAgain = collision.checkRightWall()
      expect(hitRightWallAgain).toBe(true)

      // しかし、再度 stopAtRightWall() を呼んでも位置は変わらない
      const xBefore = entity.x
      collision.stopAtRightWall()
      expect(entity.x).toBe(xBefore) // 位置は変わらない
      expect(entity.vx).toBe(0) // 速度も0のまま
    })

    it('右壁に配置後、右向き速度があれば右壁衝突判定に引っかかる', () => {
      const stage = [
        [' ', ' ', 'a'], // 右壁 (x=32-47)
      ]
      const entity = {
        x: 16,
        y: 0,
        vx: 10,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 右壁で停止
      const hitRightWall = collision.checkRightWall()
      expect(hitRightWall).toBe(true)
      if (hitRightWall) {
        collision.stopAtRightWall()
      }
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 右向きに微小な速度を与える
      entity.vx = 0.125

      // 次フレームで右壁判定を再度チェック（右向きなので衝突する）
      const hitRightWallAgain = collision.checkRightWall()
      expect(hitRightWallAgain).toBe(true)
    })

    it('右壁に配置後、左向き速度があれば右壁衝突判定に引っかからない', () => {
      const stage = [
        [' ', ' ', 'a'], // 右壁 (x=32-47)
      ]
      const entity = {
        x: 16,
        y: 0,
        vx: 10,
        vy: 0,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 右壁で停止
      const hitRightWall = collision.checkRightWall()
      expect(hitRightWall).toBe(true)
      if (hitRightWall) {
        collision.stopAtRightWall()
      }
      expect(entity.x).toBe(16)
      expect(entity.vx).toBe(0)

      // 左向きに微小な速度を与える
      entity.vx = -0.125

      // 次フレームで右壁判定を再度チェック（左向きなので衝突しない）
      const hitRightWallAgain = collision.checkRightWall()
      expect(hitRightWallAgain).toBe(false)
    })
  })

  describe('上壁の衝突判定', () => {
    it('上壁を検出する', () => {
      const stage = [['a', 'a', 'a'], [' ', ' ', ' ']]
      const entity = {
        x: 0,
        y: 16,
        vx: 0,
        vy: -5,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      expect(collision.checkUpWall()).toBe(true)
    })

    it('上壁で停止する', () => {
      const stage = [['a', 'a', 'a'], [' ', ' ', ' ']]
      const entity = {
        x: 0,
        y: 20,
        vx: 0,
        vy: -10,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.stopAtUpWall()

      expect(entity.y).toBe(16) // 壁の下側に位置調整
      expect(entity.vy).toBe(0)
    })

    it('上壁に配置後、速度0では上壁衝突判定に引っかからない', () => {
      const stage = [
        ['a', 'a', 'a'], // 上壁 (y=0-15)
        [' ', ' ', ' '], // 空白 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: 20, // 上壁に向かって移動中
        vx: 0,
        vy: -10, // 上向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 上壁衝突をチェック
      const hitUpWall = collision.checkUpWall()
      expect(hitUpWall).toBe(true)

      // 上壁に衝突したので停止処理
      if (hitUpWall) {
        collision.stopAtUpWall()
      }

      // 停止後は速度0、位置は y=16 に配置されている
      expect(entity.y).toBe(16)
      expect(entity.vy).toBe(0)

      // 次フレームで上壁判定を再度チェック（速度0なので衝突しない）
      const hitUpWallAgain = collision.checkUpWall()
      expect(hitUpWallAgain).toBe(false)
    })

    it('上壁に配置後、上向き速度があれば上壁衝突判定に引っかかる', () => {
      const stage = [
        ['a', 'a', 'a'], // 上壁 (y=0-15)
        [' ', ' ', ' '], // 空白 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: 20, // 上壁に向かって移動中
        vx: 0,
        vy: -10, // 上向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 上壁衝突をチェック
      const hitUpWall = collision.checkUpWall()
      expect(hitUpWall).toBe(true)

      // 上壁に衝突したので停止処理
      if (hitUpWall) {
        collision.stopAtUpWall()
      }

      // 停止後は速度0
      expect(entity.vy).toBe(0)

      // 再び上向き速度が加わる
      entity.vy = -0.5 // 上向き速度

      // 次フレームで上壁判定を再度チェック（速度があるので衝突するはず）
      const hitUpWallAgain = collision.checkUpWall()
      expect(hitUpWallAgain).toBe(true)
    })

    it('上壁に配置後、下向き速度があれば上壁衝突判定に引っかからない', () => {
      const stage = [
        ['a', 'a', 'a'], // 上壁 (y=0-15)
        [' ', ' ', ' '], // 空白 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: 20, // 上壁に向かって移動中
        vx: 0,
        vy: -10, // 上向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 上壁衝突をチェック
      const hitUpWall = collision.checkUpWall()
      expect(hitUpWall).toBe(true)

      // 上壁に衝突したので停止処理
      if (hitUpWall) {
        collision.stopAtUpWall()
      }

      // 停止後は速度0、位置は y=16 に配置されている
      expect(entity.y).toBe(16)
      expect(entity.vy).toBe(0)

      // 重力などで下向き速度が加わる
      entity.vy = 0.125 // 微小な下向き速度

      // 次フレームで上壁判定を再度チェック（下向きなので衝突しない）
      const hitUpWallAgain = collision.checkUpWall()
      expect(hitUpWallAgain).toBe(false)
    })
  })

  describe('下壁の衝突判定', () => {
    it('下壁を検出する', () => {
      const stage = [[' ', ' ', ' '], ['a', 'a', 'a']]
      const entity = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 5,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      expect(collision.checkDownWall()).toBe(true)
    })

    it('下壁で停止する', () => {
      const stage = [[' ', ' ', ' '], ['a', 'a', 'a']]
      const entity = {
        x: 0,
        y: -5,
        vx: 0,
        vy: 10,
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      collision.stopAtDownWall()

      expect(entity.y).toBe(0) // 壁の上側に位置調整
      expect(entity.vy).toBe(0)
    })

    it('下壁に配置後、速度0でも下壁衝突判定に引っかかるが位置は変わらない', () => {
      const stage = [
        [' ', ' ', ' '], // 空白 (y=0-15)
        ['a', 'a', 'a'], // 下壁 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: -5, // 下壁に向かって移動中
        vx: 0,
        vy: 10, // 下向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 下壁衝突をチェック
      const hitDownWall = collision.checkDownWall()
      expect(hitDownWall).toBe(true)

      // 下壁に衝突したので停止処理
      if (hitDownWall) {
        collision.stopAtDownWall()
      }

      // 停止後は速度0、位置は y=0 に配置されている
      expect(entity.y).toBe(0)
      expect(entity.vy).toBe(0)

      // 次フレームで下壁判定を再度チェック（速度0でも衝突を検出する）
      const hitDownWallAgain = collision.checkDownWall()
      expect(hitDownWallAgain).toBe(true)

      // しかし、再度 stopAtDownWall() を呼んでも位置は変わらない
      const yBefore = entity.y
      collision.stopAtDownWall()
      expect(entity.y).toBe(yBefore) // 位置は変わらない
      expect(entity.vy).toBe(0) // 速度も0のまま
    })

    it('下壁に配置後、下向き速度があれば下壁衝突判定に引っかかる', () => {
      const stage = [
        [' ', ' ', ' '], // 空白 (y=0-15)
        ['a', 'a', 'a'], // 下壁 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: -5, // 下壁に向かって移動中
        vx: 0,
        vy: 10, // 下向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 下壁衝突をチェック
      const hitDownWall = collision.checkDownWall()
      expect(hitDownWall).toBe(true)

      // 下壁に衝突したので停止処理
      if (hitDownWall) {
        collision.stopAtDownWall()
      }

      // 停止後は速度0
      expect(entity.vy).toBe(0)

      // 重力などで再び下向き速度が加わる
      entity.vy = 0.125 // GRAVITY相当

      // 次フレームで下壁判定を再度チェック（速度があるので衝突するはず）
      const hitDownWallAgain = collision.checkDownWall()
      expect(hitDownWallAgain).toBe(true)
    })

    it('下壁に配置後、上向き速度があれば下壁衝突判定に引っかからない', () => {
      const stage = [
        [' ', ' ', ' '], // 空白 (y=0-15)
        ['a', 'a', 'a'], // 下壁 (y=16-31)
      ]
      const entity = {
        x: 0,
        y: -5, // 下壁に向かって移動中
        vx: 0,
        vy: 10, // 下向き速度
        width: 16,
        height: 16,
        hitbox: new Rectangle(0, 0, 16, 16),
      }
      const collision = new TilemapCollisionComponent(entity, stage)

      // 実際のゲームループの流れ: 下壁衝突をチェック
      const hitDownWall = collision.checkDownWall()
      expect(hitDownWall).toBe(true)

      // 下壁に衝突したので停止処理
      if (hitDownWall) {
        collision.stopAtDownWall()
      }

      // 停止後は速度0、位置は y=0 に配置されている
      expect(entity.y).toBe(0)
      expect(entity.vy).toBe(0)

      // ジャンプなどで上向き速度が加わる
      entity.vy = -5 // 上向き速度

      // 次フレームで下壁判定を再度チェック（上向きなので衝突しない）
      const hitDownWallAgain = collision.checkDownWall()
      expect(hitDownWallAgain).toBe(false)
    })
  })
})
