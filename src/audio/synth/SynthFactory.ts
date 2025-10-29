import * as Tone from 'tone'

import type { SynthPreset } from './types'

/**
 * シンセサイザー生成ファクトリー
 * SynthPresetからTone.PolySynthを生成
 */
export class SynthFactory {
  /**
   * プリセット設定からPolySynthを生成
   * @param preset シンセ設定
   * @returns Tone.PolySynth
   */
  static createSynth(preset: SynthPreset): Tone.PolySynth {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: preset.waveform,
      },
      envelope: {
        attack: preset.envelope.attack,
        decay: preset.envelope.decay,
        sustain: preset.envelope.sustain,
        release: preset.envelope.release,
      },
      volume: preset.volume ?? -6,
    }).toDestination()

    return synth
  }
}
