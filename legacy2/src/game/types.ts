/**
 * ゲーム固有の型定義
 * param.js から移植
 */

import type { Difficulty } from './config'

import type { Entity } from '@/engine/entity/Entity'

/**
 * ブロックの衝突判定タイプ
 */
export enum CollisionType {
  /** 通過可能 (空気、装飾など) */
  NONE = 0,

  /** 上からのみ壁 (プラットフォーム) */
  PLATFORM = 1,

  /** 全方向壁 (通常の壁) */
  SOLID = 2,

  /** ダメージ床 (壁+ダメージ) */
  DAMAGE = 3,
}

/**
 * ブロックデータの型定義
 */
export interface BlockData {
  /** スプライトフレーム番号の配列 */
  frame: number[]

  /** 衝突判定タイプ */
  type: CollisionType

  /** オプションパラメータ */
  param?: {
    /** 当たり判定 (ダメージ床などで使用) */
    hitbox?: {
      x: number
      y: number
      width: number
      height: number
    }

    /** ダメージ量 */
    damage?: number

    /** アニメーション頻度 (フレーム数) */
    freq?: number

    /** アニメーションループ */
    loop?: boolean

    /** 描画レイヤー ('top' など) */
    layer?: string

    /** 透明度 (0.0-1.0) */
    alpha?: number
  }
}

/**
 * ステージデータの型定義
 */
export interface StageData {
  /** ステージ名 (日本語) - オプショナル */
  name?: string

  /** ステージ名 (英語) - オプショナル */
  engName?: string

  /** ステージマップデータ (string[][]) */
  stages: string[][]

  /** 背景レイヤー */
  bg: string[]

  /** 前景レイヤー */
  fg: string[]

  /** BGM名 (undefined = 前のBGMを引き継ぐ) */
  bgm?: string

  /** オプションパラメータ */
  param?: {
    /** ボスクラス（コンストラクタシグネチャ） */
    boss?: new (x: number, y: number, stage: string[][]) => Entity
  }
}

/**
 * プレイヤーの状態
 * legacy の PlayerState クラスに対応
 */
export enum PlayerState {
  /** 立ち状態 */
  STAND = 'stand',

  /** 歩き状態 */
  WALK = 'walk',

  /** ジャンプ中 */
  JUMP = 'jump',

  /** しゃがみ中 */
  SIT = 'sit',

  /** しゃがみから立ち上がり中 */
  STAND_UP = 'standUp',

  /** ダメージ中（通常） */
  DAMAGE = 'damage',

  /** ダメージ中（落とし穴） */
  DAMAGE_PIT = 'damagePit',

  /** 水中 */
  IN_WATER = 'inWater',
}

/**
 * DekaNasake（ボス）の状態
 */
export enum DekaNasakeState {
  /** 通常移動（ゆっくり） */
  WALK = 'walk',

  /** 風を受けた直後（待機中） */
  HIT_WIND = 'hitWind',

  /** 逃走中（高速移動） */
  RUN = 'run',
}

/**
 * UIタイプデータ
 * legacy の UITypeData に対応
 */
export interface UITypeData {
  /** 使用する画像キー */
  imageKey: string

  /** アニメーション名（通常時） */
  animationKey: string

  /** 押下時のアニメーション名（存在する場合） */
  pushedAnimationKey?: string

  /** 対応するキーコード（Input用） */
  keyCode?: string

  /** 幅 */
  width: number

  /** 高さ */
  height: number
}

/**
 * ゲーム設定データ
 */
export interface GameSettingsData {
  /** 難易度 */
  difficulty: Difficulty

  /** BGM音量 (dB単位: -60 ~ 0) */
  bgmVolume: number

  /** SE音量 (dB単位: -60 ~ 0) */
  sfxVolume: number
}
