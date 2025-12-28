/**
 * ゲーム固有の型定義
 */

/** ブロックの衝突判定タイプ */
export enum CollisionType {
  /** 通過可能 */
  NONE = 0,
  /** 上からのみ壁 */
  PLATFORM = 1,
  /** 全方向壁 */
  SOLID = 2,
  /** ダメージ床 */
  DAMAGE = 3,
}

/** ブロックデータ */
export interface BlockData {
  frame: number[]
  type: CollisionType
  param?: {
    hitbox?: { x: number; y: number; width: number; height: number }
    damage?: number
    freq?: number
    loop?: boolean
    layer?: string
    alpha?: number
  }
}

/** プレイヤーの状態 */
export enum PlayerState {
  STAND = 'stand',
  WALK = 'walk',
  JUMP = 'jump',
  SIT = 'sit',
  STAND_UP = 'standUp',
  DAMAGE = 'damage',
  DAMAGE_PIT = 'damagePit',
}

/** ステージデータ */
export interface StageData {
  name?: string
  engName?: string
  bgm?: string
  bg: string[]
  fg: string[]
  stages: string[][]
  param?: {
    boss?: unknown // TODO: ボスクラス型を定義
  }
}

/** UIタイプデータ */
export interface UITypeData {
  /** 使用する画像キー */
  imageKey: string
  /** アニメーション名（通常時） */
  animationKey: string
  /** 押下時のアニメーション名 */
  pushedAnimationKey?: string
  /** 対応するキーコード（Input用） */
  keyCode?: string
  /** 幅 */
  width: number
  /** 高さ */
  height: number
}
