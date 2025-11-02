/**
 * イージング関数ライブラリ
 * legacy/util.js から移植
 */

/**
 * 値を最小値と最大値の範囲内にクランプする
 */
export const clamp = (x: number, min: number, max: number): number => {
  return Math.min(Math.max(x, min), max)
}

/**
 * 線形補間
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

/**
 * 線形イージング (変化なし)
 */
export const easeLinear = (
  start: number,
  end: number,
  time: number,
  duration: number
): number => {
  const x = clamp(time, 0, duration) / duration
  const t = x
  return lerp(start, end, t)
}

/**
 * Exponential Out イージング (急速に減速)
 */
export const easeOutExpo = (
  start: number,
  end: number,
  time: number,
  duration: number
): number => {
  const x = clamp(time, 0, duration) / duration
  const t = x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
  return lerp(start, end, t)
}

/**
 * Sine Out イージング (滑らかに減速)
 */
export const easeOutSine = (
  start: number,
  end: number,
  time: number,
  duration: number
): number => {
  const x = clamp(time, 0, duration) / duration
  const t = Math.sin((x * Math.PI) / 2)
  return lerp(start, end, t)
}

/**
 * Sine In イージング (滑らかに加速)
 */
export const easeInSine = (
  start: number,
  end: number,
  time: number,
  duration: number
): number => {
  const x = clamp(time, 0, duration) / duration
  const t = 1 - Math.cos((x * Math.PI) / 2)
  return lerp(start, end, t)
}
