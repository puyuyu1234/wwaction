/**
 * 音響システム型定義
 */

/**
 * 効果音定義マップ
 */
export type SoundEffectMap = Record<string, string>

/**
 * BGM設定
 */
export interface MusicConfig {
  /** 音源ファイルパス */
  path: string
  /** ループ再生するか */
  loop?: boolean
  /** 音量（dB、-Infinityから0まで） */
  volume?: number
}

/**
 * 効果音設定
 */
export interface SoundEffectConfig {
  /** 音源ファイルパス */
  path: string
  /** 音量（dB、-Infinityから0まで） */
  volume?: number
}

/**
 * 音響初期化状態
 */
export enum AudioState {
  /** 未初期化 */
  UNINITIALIZED = 'uninitialized',
  /** 初期化中 */
  INITIALIZING = 'initializing',
  /** 初期化済み */
  READY = 'ready',
  /** エラー */
  ERROR = 'error',
}
