// ゲームの定数
export const BLOCKSIZE = 16

// 衝突判定タイプ（シンプルな文字列ベース）
export type CollisionType = 'none' | 'solid' | 'platform'

// ブロックデータの型
export interface BlockData {
  frame: number[]
  collision: CollisionType
  param?: {
    hitbox?: { x: number; y: number; width: number; height: number }
    damage?: number
    freq?: number
    loop?: boolean
    layer?: 'top' | 'bottom'
    alpha?: number
  }
}

// ステージデータの型
export interface StageData {
  name: string
  engName: string
  stages: string[][]
  bg: string[]
  fg: string[]
  param?: {
    bgm?: string
    boss?: any
  }
}

// プレイヤーの状態
export enum PlayerState {
  STAND = 'stand',
  WALK = 'walk',
  JUMP = 'jump',
  SIT = 'sit',
  STAND_UP = 'standUp',
  DAMAGE = 'damage',
  INWATER = 'inwater',
  DAMAGEPIT = 'damagePit'
}

// 難易度ごとのHP
export const HPDATA = [7, 5, 3, 5]

// フォント
export const FONT = "'MS Gothic', 'ＭＳ ゴシック', 'MS ゴシック', monospace"
