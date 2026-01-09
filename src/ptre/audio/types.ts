/**
 * Audio System Type Definitions
 */

/**
 * 音楽ソース（Audio）
 */
export interface AudioSource {
  type: 'audio'
  /** 音声ファイルパス */
  path: string
  /** ループ再生するか（デフォルト: true） */
  loop?: boolean
  /** 音量（dB、デフォルト: -6） */
  volume?: number
  /** ループ開始位置（秒） */
  loopStart?: number
  /** ループ終了位置（秒） */
  loopEnd?: number
}

/** MusicSourceはAudioSourceのエイリアス */
export type MusicSource = AudioSource

/**
 * 効果音設定
 */
export interface SoundEffectConfig {
  /** 音声ファイルパス */
  path: string
  /** 音量（dB、デフォルト: -6） */
  volume?: number
}
