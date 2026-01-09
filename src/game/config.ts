/**
 * ゲーム固有定数
 */
import type { BlockData, EntityDataMap, UITypeData } from './types'
import { CollisionType } from './types'

import { THEME_BLOCK_OVERRIDE, THEME_ENTITY_OVERRIDE } from '@/generated/themes'

/** デバッグモード */
export const DEBUG = import.meta.env.DEV

/** フォント */
export const FONT = "'MS Gothic', 'ＭＳ ゴシック', 'MS ゴシック', monospace"

/** ブロックサイズ (px) */
export const BLOCKSIZE = 16

/** 重力加速度 (px/frame²) */
export const GRAVITY = 0.125

/** 画面サイズ */
export const SCREEN = {
  WIDTH: 320,
  HEIGHT: 240,
} as const

/** 描画レイヤー z-index */
export const Z_INDEX = {
  BACKGROUND: -10,
  TILEMAP: 0,
  TUTORIAL_UI: 10,
  ENTITY: 100,
  FOREGROUND: 500,
  FOG: 600,
  UI: 1000,
} as const

/** ブロックデータの型 */
export type BlockDataMap = Partial<Record<string, BlockData>>

/** ベースブロックマップ（全テーマ共通） */
export const BASE_BLOCKDATA: BlockDataMap = {
  ' ': { frame: [0], type: CollisionType.NONE },
  a: { frame: [1], type: CollisionType.PLATFORM },
  b: { frame: [2], type: CollisionType.PLATFORM },
  c: { frame: [3], type: CollisionType.PLATFORM },
  d: { frame: [4], type: CollisionType.NONE },
  e: { frame: [5], type: CollisionType.NONE },
  f: { frame: [6], type: CollisionType.NONE },
  g: { frame: [7], type: CollisionType.SOLID },
  h: { frame: [8], type: CollisionType.SOLID },
  i: { frame: [9], type: CollisionType.SOLID },
  j: { frame: [10], type: CollisionType.NONE },
  k: { frame: [11], type: CollisionType.NONE },
  l: { frame: [12], type: CollisionType.NONE },
  m: { frame: [13], type: CollisionType.NONE },
  n: { frame: [14], type: CollisionType.NONE },
  o: { frame: [15], type: CollisionType.NONE },
  p: { frame: [16], type: CollisionType.NONE },
  q: { frame: [17], type: CollisionType.SOLID },
  r: { frame: [18], type: CollisionType.SOLID },
  s: { frame: [19], type: CollisionType.SOLID },
  t: { frame: [20], type: CollisionType.PLATFORM },
  u: { frame: [21], type: CollisionType.PLATFORM },
  v: { frame: [22], type: CollisionType.SOLID },
  w: { frame: [23], type: CollisionType.SOLID },
  x: {
    frame: [24],
    type: CollisionType.DAMAGE,
    param: { hitbox: { x: 1, y: 12, width: 14, height: 4 }, damage: 1 },
  },
  y: { frame: [25], type: CollisionType.NONE },
  z: {
    frame: [26],
    type: CollisionType.DAMAGE,
    param: { hitbox: { x: 1, y: 0, width: 14, height: 4 }, damage: 1 },
  },
  A: { frame: [27], type: CollisionType.SOLID },
  B: { frame: [28], type: CollisionType.SOLID },
  C: { frame: [29], type: CollisionType.SOLID },
  D: { frame: [30], type: CollisionType.PLATFORM },
  E: { frame: [31], type: CollisionType.PLATFORM },
  F: {
    frame: [32],
    type: CollisionType.DAMAGE,
    param: { hitbox: { x: 12, y: 1, width: 4, height: 14 }, damage: 1 },
  },
  G: {
    frame: [33],
    type: CollisionType.DAMAGE,
    param: { hitbox: { x: 0, y: 1, width: 4, height: 14 }, damage: 1 },
  },
  H: { frame: [34], type: CollisionType.NONE },
  I: { frame: [35], type: CollisionType.NONE },
  J: { frame: [36], type: CollisionType.SOLID },
  K: { frame: [37], type: CollisionType.SOLID },
  L: { frame: [38], type: CollisionType.SOLID },
  M: { frame: [39], type: CollisionType.SOLID },
  N: { frame: [40], type: CollisionType.NONE },
  O: { frame: [41], type: CollisionType.NONE },
  P: { frame: [42], type: CollisionType.NONE },
  Q: { frame: [43], type: CollisionType.NONE },
  R: { frame: [44], type: CollisionType.NONE },
  S: { frame: [45], type: CollisionType.NONE },
  T: { frame: [46], type: CollisionType.NONE },
  U: { frame: [47], type: CollisionType.NONE },
  V: { frame: [48], type: CollisionType.NONE },
  W: { frame: [49], type: CollisionType.NONE },
  X: { frame: [50], type: CollisionType.SOLID },
  Y: { frame: [51], type: CollisionType.SOLID },
  Z: { frame: [52], type: CollisionType.SOLID },
  // 記号（frame 53以降）
  '!': { frame: [53], type: CollisionType.NONE },
  '@': { frame: [54], type: CollisionType.NONE },
  '#': { frame: [55], type: CollisionType.NONE },
  $: { frame: [56], type: CollisionType.NONE },
  '%': { frame: [57], type: CollisionType.NONE },
  '^': { frame: [58], type: CollisionType.NONE },
  '&': { frame: [59], type: CollisionType.NONE },
  '(': { frame: [60], type: CollisionType.NONE },
  ')': { frame: [61], type: CollisionType.NONE },
  '-': { frame: [62], type: CollisionType.NONE },
  _: { frame: [63], type: CollisionType.NONE },
  '+': { frame: [64], type: CollisionType.NONE },
  '=': { frame: [65], type: CollisionType.NONE },
  '[': { frame: [66], type: CollisionType.NONE },
  ']': { frame: [67], type: CollisionType.NONE },
  '|': { frame: [68], type: CollisionType.SOLID },
  ':': { frame: [69], type: CollisionType.PLATFORM },
  ';': { frame: [70], type: CollisionType.NONE },
}

// THEME_BLOCK_OVERRIDE は generated/themes.ts からインポート

/**
 * テーマに応じたブロックマップを取得
 */
export function getBlockData(theme: string): BlockDataMap {
  return {
    ...BASE_BLOCKDATA,
    ...THEME_BLOCK_OVERRIDE[theme],
  }
}

/**
 * 難易度ごとのHP
 * [EASY, NORMAL, HARD, LUNATIC]
 */
export const HPDATA = [9, 5, 3, 1]

/**
 * ベースエンティティマップ（全テーマ共通）
 */
export const BASE_ENTITYDATA: EntityDataMap = {
  '1': { entityClass: 'Nasake' },
  '2': { entityClass: 'Gurasan' },
  '3': { entityClass: 'GurasanNotFall' },
  '4': { entityClass: '' },
  '5': { entityClass: 'Nuefu' },
  '6': { entityClass: 'Shimi' },
  '7': { entityClass: 'Funkorogashi' },
  '8': { entityClass: 'Semi' },
  '?': { entityClass: 'Potion' },
  '~': { entityClass: 'Coin' },
}

// THEME_ENTITY_OVERRIDE は generated/themes.ts からインポート

/**
 * テーマに応じたエンティティマップを取得
 */
export function getEntityData(theme: string): EntityDataMap {
  return {
    ...BASE_ENTITYDATA,
    ...THEME_ENTITY_OVERRIDE[theme],
  }
}


/**
 * UIタイプデータマップ
 * キー: UIキー文字
 * 値: UI描画設定
 */
export const UI_TYPE_DATA: Record<string, UITypeData> = {
  w: {
    imageKey: 'entity',
    animationKey: 'W',
    pushedAnimationKey: 'W-pushed',
    keyCode: 'KeyW',
    width: 16,
    height: 16,
  },
  a: {
    imageKey: 'entity',
    animationKey: 'A',
    pushedAnimationKey: 'A-pushed',
    keyCode: 'KeyA',
    width: 16,
    height: 16,
  },
  s: {
    imageKey: 'entity',
    animationKey: 'S',
    pushedAnimationKey: 'S-pushed',
    keyCode: 'KeyS',
    width: 16,
    height: 16,
  },
  d: {
    imageKey: 'entity',
    animationKey: 'D',
    pushedAnimationKey: 'D-pushed',
    keyCode: 'KeyD',
    width: 16,
    height: 16,
  },
  '+': {
    imageKey: 'entity',
    animationKey: '+',
    width: 16,
    height: 16,
  },
  ' ': {
    imageKey: 'space',
    animationKey: 'space',
    pushedAnimationKey: 'space-pushed',
    keyCode: 'Space',
    width: 48,
    height: 16,
  },
}
