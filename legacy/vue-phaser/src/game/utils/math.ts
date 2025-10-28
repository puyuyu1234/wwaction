// 数値ユーティリティ関数
// 注: 現在未使用だが、将来的にアニメーションやエフェクトで使用予定

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function easeLinear(start: number, end: number, time: number, duration: number): number {
  const x = clamp(time, 0, duration) / duration
  const t = x
  return lerp(start, end, t)
}

export function easeOutExpo(start: number, end: number, time: number, duration: number): number {
  const x = clamp(time, 0, duration) / duration
  const t = x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
  return lerp(start, end, t)
}

export function easeOutSine(start: number, end: number, time: number, duration: number): number {
  const x = clamp(time, 0, duration) / duration
  const t = Math.sin((x * Math.PI) / 2)
  return lerp(start, end, t)
}

export function easeInSine(start: number, end: number, time: number, duration: number): number {
  const x = clamp(time, 0, duration) / duration
  const t = 1 - Math.cos((x * Math.PI) / 2)
  return lerp(start, end, t)
}

export function makeRangeWithEnd(start: number, end: number, step: number): number[] {
  const range: number[] = []
  for (let i = start; i < end; i += step) {
    range.push(i)
  }
  range.push(end)
  return range
}
