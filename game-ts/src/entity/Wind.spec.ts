// import { describe, it, expect } from 'vitest'
// import { Wind } from './Wind'

// describe('Wind', () => {
//   it('moves horizontally', () => {
//     const stage = [[' ', ' ', ' ']]
//     const wind = new Wind(0, 0, 2, stage)

//     wind.update()

//     expect(wind.x).toBe(2)
//   })

//   it('applies gravity', () => {
//     const stage = [[' ', ' ', ' ']]
//     const wind = new Wind(0, 0, 2, stage)

//     wind.update()

//     expect(wind.vy).toBe(0.125)
//   })

//   it('bounces back from left wall', () => {
//     const stage = [['a', ' ', ' ']] // 左に壁
//     const wind = new Wind(18, 0, -5, stage)

//     wind.update()

//     expect(wind.vx).toBe(5) // 反転
//   })

//   it('bounces back from right wall', () => {
//     const stage = [[' ', ' ', 'a']] // 右に壁
//     const wind = new Wind(16, 0, 5, stage)

//     wind.update()

//     expect(wind.vx).toBe(-5) // 反転
//   })

//   it('stops at ceiling', () => {
//     const stage = [
//       ['a', 'a', 'a'],
//       [' ', ' ', ' '],
//     ]
//     const wind = new Wind(0, 20, 0, stage)
//     wind.vy = -10

//     wind.update()

//     expect(wind.vy).toBe(0) // 停止
//   })

//   it('stops at floor', () => {
//     const stage = [
//       [' ', ' ', ' '],
//       ['a', 'a', 'a'],
//     ]
//     const wind = new Wind(0, -5, 0, stage)
//     wind.vy = 10

//     wind.update()

//     expect(wind.vy).toBe(0) // 停止
//   })

//   it('continues moving if no wall', () => {
//     const stage = [
//       [' ', ' ', ' ', ' ', ' '],
//       [' ', ' ', ' ', ' ', ' '],
//     ]
//     const wind = new Wind(0, 0, 3, stage)

//     wind.update()
//     wind.update()
//     wind.update()

//     expect(wind.x).toBe(9) // 3 * 3 frames
//     expect(wind.vx).toBe(3) // 速度維持
//   })
// })
