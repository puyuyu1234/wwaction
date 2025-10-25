// import { describe, it, expect } from 'vitest'
// import { TilemapCollisionComponent } from './TilemapCollisionComponent'
// import { Rectangle } from '@/core/Rectangle'

// describe('TilemapCollisionComponent', () => {
//   describe('Left wall collision', () => {
//     it('detects left wall', () => {
//       const stage = [
//         ['a', ' ', ' '], // 'a' = PLATFORM
//       ]
//       const entity = {
//         x: 16,
//         y: 0,
//         vx: -5,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: new Rectangle(0, 0, 16, 16),
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       expect(collision.checkLeftWall()).toBe(true)
//     })

//     it('stops at left wall', () => {
//       const stage = [['a', ' ', ' ']]
//       const entity = {
//         x: 20,
//         y: 0,
//         vx: -10,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: new Rectangle(0, 0, 16, 16),
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.stopAtLeftWall()

//       expect(entity.x).toBe(16) // 壁の右側に位置調整
//       expect(entity.vx).toBe(0)
//     })

//     it('bounces at left wall', () => {
//       const stage = [['a', ' ', ' ']]
//       const entity = {
//         x: 18,
//         y: 0,
//         vx: -3,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: new Rectangle(0, 0, 16, 16),
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.bounceAtLeftWall()

//       expect(entity.x).toBe(16)
//       expect(entity.vx).toBe(3) // 反転
//     })
//   })

//   describe('Right wall collision', () => {
//     it('detects right wall', () => {
//       const stage = [[' ', ' ', 'a']]
//       const entity = {
//         x: 16,
//         y: 0,
//         vx: 5,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       expect(collision.checkRightWall()).toBe(true)
//     })

//     it('stops at right wall', () => {
//       const stage = [[' ', ' ', 'a']]
//       const entity = {
//         x: 16,
//         y: 0,
//         vx: 10,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.stopAtRightWall()

//       expect(entity.x).toBe(16) // 壁の左側に位置調整
//       expect(entity.vx).toBe(0)
//     })

//     it('bounces at right wall', () => {
//       const stage = [[' ', ' ', 'a']]
//       const entity = {
//         x: 16,
//         y: 0,
//         vx: 2,
//         vy: 0,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.bounceAtRightWall()

//       expect(entity.x).toBe(16)
//       expect(entity.vx).toBe(-2) // 反転
//     })
//   })

//   describe('Up wall collision', () => {
//     it('detects up wall', () => {
//       const stage = [['a', 'a', 'a'], [' ', ' ', ' ']]
//       const entity = {
//         x: 0,
//         y: 16,
//         vx: 0,
//         vy: -5,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       expect(collision.checkUpWall()).toBe(true)
//     })

//     it('stops at up wall', () => {
//       const stage = [['a', 'a', 'a'], [' ', ' ', ' ']]
//       const entity = {
//         x: 0,
//         y: 20,
//         vx: 0,
//         vy: -10,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.stopAtUpWall()

//       expect(entity.y).toBe(16) // 壁の下側に位置調整
//       expect(entity.vy).toBe(0)
//     })
//   })

//   describe('Down wall collision', () => {
//     it('detects down wall', () => {
//       const stage = [[' ', ' ', ' '], ['a', 'a', 'a']]
//       const entity = {
//         x: 0,
//         y: 0,
//         vx: 0,
//         vy: 5,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       expect(collision.checkDownWall()).toBe(true)
//     })

//     it('stops at down wall', () => {
//       const stage = [[' ', ' ', ' '], ['a', 'a', 'a']]
//       const entity = {
//         x: 0,
//         y: -5,
//         vx: 0,
//         vy: 10,
//         width: 16,
//         height: 16,
//         hitbox: { x: 0, y: 0, width: 16, height: 16 },
//       }
//       const collision = new TilemapCollisionComponent(entity, stage)

//       collision.stopAtDownWall()

//       expect(entity.y).toBe(0) // 壁の上側に位置調整
//       expect(entity.vy).toBe(0)
//     })
//   })
// })
