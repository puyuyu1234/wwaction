/**
 * Instrument Presets
 * ドメイン層のプリセット定義（Tone.jsに依存しない）
 */

import type { TrackConfig } from './types'

/**
 * 楽器プリセット集
 * ゲームごとにプリセットを追加していく
 */
export const PRESETS = {
  /** キック（バスドラム）: 短く鋭いアタック */
  KICK: {
    synthType: 'membrane',
    waveform: 'sine',
    envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.001 },
    volume: -3,
    detune: -2400, // -2オクターブ
  },

  /** スネア: 短いアタック、適度なリリース */
  SNARE: {
    synthType: 'noise',
    noiseColor: 'pink',
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 },
    volume: 0,
  },

  /** ハイハット: 非常に短いアタック */
  HIHAT: {
    synthType: 'noise',
    noiseColor: 'white',
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    volume: -12,
  },

  /** クラッシュシンバル: 長いリリース */
  CRASH: {
    synthType: 'noise',
    noiseColor: 'white',
    envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1 },
    volume: -15,
  },

  /** ベース: 長めのサスティン */
  BASS: {
    synthType: 'synth',
    waveform: 'sawtooth',
    envelope: { attack: 0.001, decay: 0.5, sustain: 0.3, release: 0.1 },
    volume: -1,
    detune: 1200,
  },

  /** リード: バランスの取れたADSR */
  LEAD: {
    synthType: 'synth',
    waveform: 'square',
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.5, release: 1 },
    volume: -6,
    detune: 1200,
  },

  /** リード: アタック弱め */
  LEADAT: {
    synthType: 'synth',
    waveform: 'square',
    envelope: { attack: 0.1, decay: 1, sustain: 0.7, release: 1 },
    volume: -6,
    detune: 1200,
  },

  /** アルペジエーター: 短いディケイ */
  ARPEGGIO: {
    synthType: 'synth',
    waveform: 'square',
    envelope: { attack: 0.005, decay: 0.25, sustain: 0, release: 0 },
    volume: -3,
    detune: 1200,
  },

  /** エフェクト音: 変則的 */
  FX: {
    synthType: 'synth',
    waveform: 'sawtooth',
    envelope: { attack: 0.1, decay: 0.4, sustain: 0.2, release: 1.0 },
    volume: -16,
  },
} as const satisfies Record<string, TrackConfig>
