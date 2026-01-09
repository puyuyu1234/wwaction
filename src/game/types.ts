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

/** ダメージブロックのヒットボックス */
export interface DamageHitbox {
  x: number
  y: number
  width: number
  height: number
}

/** 基本ブロックデータ */
interface BaseBlockData {
  frame: number[]
  /** アニメーション周期（フレーム数） */
  freq?: number
}

/** 通過可能ブロック */
interface NoneBlockData extends BaseBlockData {
  type: CollisionType.NONE
}

/** 足場ブロック */
interface PlatformBlockData extends BaseBlockData {
  type: CollisionType.PLATFORM
}

/** 壁ブロック */
interface SolidBlockData extends BaseBlockData {
  type: CollisionType.SOLID
}

/** ダメージブロック */
interface DamageBlockData extends BaseBlockData {
  type: CollisionType.DAMAGE
  param: {
    hitbox: DamageHitbox
    damage: number
  }
}

/** ブロックデータ */
export type BlockData = NoneBlockData | PlatformBlockData | SolidBlockData | DamageBlockData

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

/** ステージテーマ */
export type StageTheme = 'plain' | 'forest'

/** ステージレイヤー（衝突判定用） */
export type StageLayers = string[][][] // [layer][row][col]

/** ブロックデータマップ */
export type BlockDataMap = Partial<Record<string, BlockData>>

/**
 * ステージコンテキスト
 * エンティティに渡すステージ関連情報をまとめたもの
 */
export interface StageContext {
  /** ステージレイヤー */
  layers: StageLayers
  /** テーマ適用済みブロックデータ */
  blockData: BlockDataMap
}

/**
 * ステージJSON入力形式
 * stages/*.json のフォーマット（bg/fgはオプショナル）
 */
export interface StageDataInput {
  name?: string
  engName?: string
  bgm?: string
  theme: StageTheme
  /** 背景パターン（省略時はテーマデフォルト） */
  bg?: string[]
  /** 前景パターン（省略時はテーマデフォルト） */
  fg?: string[]
  /** タイルマップレイヤー配列 */
  layers: string[][]
}

/**
 * ステージデータ（ランタイム用）
 * generate-stages.ts によりデフォルト値が適用された状態
 */
export interface StageData {
  name?: string
  engName?: string
  /** BGMファイル名（拡張子なし） */
  bgm?: string
  theme: StageTheme
  /** 背景パターン（デフォルト適用済み） */
  bg: string[]
  /** 前景パターン（デフォルト適用済み） */
  fg: string[]
  /** タイルマップレイヤー配列 */
  stages: string[][]
}

/** エンティティデータマップ */
export type EntityDataMap = Record<string, { entityClass: string }>

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
