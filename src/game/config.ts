/**
 * ゲーム定数とドメイン知識
 * param.js から移植
 */

import type { BlockData, UITypeData } from './types'
import { CollisionType } from './types'

/**
 * デバッグモード
 * import.meta.env.DEV を使用して開発時のみtrue
 */
export const DEBUG = import.meta.env.DEV

/**
 * ブロックサイズ (ピクセル)
 */
export const BLOCKSIZE = 16

/**
 * 重力加速度 (ピクセル/フレーム²)
 */
export const GRAVITY = 0.125

/**
 * 描画レイヤーのz-index定義
 * PixiJSのsortableChildrenで使用
 */
export const Z_INDEX = {
  /** 視差スクロール背景（一番奥） */
  BACKGROUND: -10,
  /** タイルマップ（地面・オブジェクト） */
  TILEMAP: 0,
  /** チュートリアルUI（地面の上、キャラクターの下） */
  TUTORIAL_UI: 10,
  /** ステージデバッグ描画 */
  STAGE_DEBUG: 20,
  /** エンティティ（プレイヤー、敵、風など） */
  ENTITY: 100,
  /** エンティティデバッグ描画（ヒットボックス） */
  ENTITY_DEBUG: 200,
  /** ステージ名表示演出 */
  STAGE_NAME: 1000,
  /** 画面遷移演出（最前面） */
  SCENE_TRANSITION: 1001,
} as const

/**
 * 難易度レベル
 */
export enum Difficulty {
  EASY = 0,
  NORMAL = 1,
  HARD = 2,
  LUNATIC = 3,
}

/**
 * 難易度名（表示用）
 */
export const DIFFICULTY_NAMES = ['EASY', 'NORMAL', 'HARD', 'LUNATIC'] as const

/**
 * 難易度ごとのHP
 * [EASY, NORMAL, HARD, LUNATIC]
 */
export const HPDATA = [7, 5, 3, 1]

/**
 * フォント定義
 */
export const FONT = "'MS Gothic', 'ＭＳ ゴシック', 'MS ゴシック', monospace"

/**
 * 効果音キー定義
 * マジックストリング防止用
 */
export const SFX_KEYS = {
  JUMP: 'jump',
  DAMAGE: 'damage',
  HEAL: 'heal',
  GOAL: 'goal',
} as const

/**
 * 音源アセットパス定義
 */
export const AUDIO_ASSETS = {
  sfx: {
    jump: '/assets/sound/sfx/jump.mp3',
    damage: '/assets/sound/sfx/gameover.mp3', // damage.mp3がないのでgameover.mp3を使用
    heal: '/assets/sound/sfx/heal.mp3',
    goal: '/assets/sound/sfx/wind.mp3', // goal.mp3がないのでwind.mp3を使用
  },
  music: (stage: number) => `/assets/sound/music/stage${stage}.mp3`,
  midi: {
    test: '/assets/sound/music/test.mid',
  },
  midiTracks: {
    test: {
      // Track 0: Noise, sine, 0.001, 0.5, 0, 0.001, -22dB
      0: {
        synthType: 'noise' as const,
        waveform: 'sine' as const, // NoiseSynthではwaveformは使われないが型のために必要
        envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.001 },
        volume: -22,
      },
      // Track 1: Basic, square, 0.001, 0.15, 0, 0.001, -10dB
      1: {
        synthType: 'synth' as const,
        waveform: 'square' as const,
        envelope: { attack: 0.001, decay: 0.5, sustain: 0.15, release: 0.001 },
        volume: -10,
      },
      // Track 2: Basic, sawtooth, 0.001, 1, 0.3, 1, -10dB
      2: {
        synthType: 'synth' as const,
        waveform: 'sawtooth' as const,
        envelope: { attack: 0.001, decay: 0.7, sustain: 0.1, release: 1 },
        volume: -10,
      },
      // Track 3: Basic, square, 0, 0.4, 0.001, 0.6, -15dB
      3: {
        synthType: 'synth' as const,
        waveform: 'square' as const,
        envelope: { attack: 0.4, decay: 0.001, sustain: 1, release: 0.6 },
        volume: -15,
      },
      // Track 4: Basic, sawtooth, 0.001, 0.5, 0.1, 0.001, -10dB
      4: {
        synthType: 'synth' as const,
        waveform: 'sawtooth' as const,
        envelope: { attack: 0.001, decay: 0.5, sustain: 0.1, release: 0.001 },
        volume: -10,
      },
      // Track 5: Basic, square, デフォルト設定
      5: {
        synthType: 'synth' as const,
        waveform: 'square' as const,
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
      },
    },
  },
} as const

// スプライトシート定義は scripts/generate-spritesheets-simple.ts で
// public/assets/spritesheets/*.json として生成済み

/**
 * ブロックデータマップ
 * キー: ステージマップ内の文字
 * 値: ブロックの性質
 */
export const BLOCKDATA: Partial<Record<string, BlockData>> = {
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
    param: {
      hitbox: { x: 1, y: 12, width: 14, height: 4 },
      damage: 1,
    },
  },
  y: { frame: [25], type: CollisionType.NONE },
  z: {
    frame: [26],
    type: CollisionType.DAMAGE,
    param: {
      hitbox: { x: 1, y: 0, width: 14, height: 4 },
      damage: 1,
    },
  },
  A: { frame: [27], type: CollisionType.SOLID },
  B: { frame: [28], type: CollisionType.SOLID },
  C: { frame: [29], type: CollisionType.SOLID },
  D: { frame: [30], type: CollisionType.PLATFORM },
  E: { frame: [31], type: CollisionType.PLATFORM },
  F: {
    frame: [32],
    type: CollisionType.DAMAGE,
    param: {
      hitbox: { x: 12, y: 1, width: 4, height: 14 },
      damage: 1,
    },
  },
  G: {
    frame: [33],
    type: CollisionType.DAMAGE,
    param: {
      hitbox: { x: 0, y: 1, width: 4, height: 14 },
      damage: 1,
    },
  },
  H: {
    frame: [34, 53, 54, 55],
    type: CollisionType.NONE,
    param: {
      freq: 12,
      loop: true,
      layer: 'top',
      alpha: 0.8,
    },
  },
  I: {
    frame: [35],
    type: CollisionType.NONE,
    param: {
      layer: 'top',
      alpha: 0.8,
    },
  },
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
  X: { frame: [50], type: CollisionType.NONE },
  Y: { frame: [51], type: CollisionType.NONE },
  Z: { frame: [52], type: CollisionType.NONE },
}

/**
 * エンティティスポーンマップ
 * キー: ステージマップ内の文字
 * 値: エンティティ設定
 */
export const ENTITYDATA = {
  '1': { entityClass: 'Nasake' },
  '2': { entityClass: 'Gurasan' },
  '3': { entityClass: 'Potion' },
  '4': { entityClass: 'GurasanNotFall' },
  '5': { entityClass: 'Nuefu' },
} as const

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

// STAGEDATAは stages.ts で自動生成される
export { STAGEDATA } from './stages'
