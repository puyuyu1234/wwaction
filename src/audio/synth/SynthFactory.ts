import * as Tone from 'tone'

import type { SynthPreset } from './types'

/**
 * シンセサイザー生成ファクトリー
 * SynthPresetからTone.PolySynthを生成
 */
export class SynthFactory {
  /**
   * プリセット設定からPolySynthまたはNoiseSynthを生成
   * @param preset シンセ設定
   * @returns Tone.PolySynth | Tone.NoiseSynth
   */
  static createSynth(preset: SynthPreset): Tone.PolySynth | Tone.NoiseSynth {
    if (preset.synthType === 'noise') {
      // NoiseSynthは単音専用なのでPolySynthにできない
      const synth = new Tone.NoiseSynth({
        noise: {
          type: 'white',
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
    } else {
      // 通常のSynth用のPolySynth
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
}
