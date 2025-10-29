import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'

import { SynthFactory } from './synth/SynthFactory'
import type { TrackSynthMap } from './synth/types'
import type { MusicConfig } from './types'

/**
 * BGM再生クラス
 * - MP3をループ再生（Tone.Player）
 * - MIDIをトラック別カスタム音源で再生（Tone.PolySynth + Tone.Part）
 */
export class MusicPlayer {
  private player: Tone.Player | null = null
  private currentPath: string | null = null

  // MIDI再生用
  private synths: Tone.PolySynth[] = []
  private parts: Tone.Part[] = []
  private midiMode = false

  /**
   * BGMを再生
   * @param config BGM設定（文字列の場合はパスとして扱う）
   */
  async play(config: string | MusicConfig): Promise<void> {
    const path = typeof config === 'string' ? config : config.path
    const loop = typeof config === 'string' ? true : (config.loop ?? true)
    const volume = typeof config === 'string' ? -6 : (config.volume ?? -6)

    // 既に同じBGMが再生中なら何もしない
    if (this.currentPath === path && this.player?.state === 'started') {
      return
    }

    // 既存のBGMを停止
    this.stop()

    // 新しいPlayerを作成
    this.player = new Tone.Player({
      url: path,
      loop,
      volume,
    }).toDestination()

    // ロード完了後に再生
    await this.player.load(path)
    this.player.start()
    this.currentPath = path

    console.log(`🎵 BGM started: ${path}`)
  }

  /**
   * MIDIファイルを再生
   * @param midiPath MIDIファイルパス
   * @param trackSynthMap トラック別シンセ設定
   * @param loop ループ再生するか
   */
  async playMidi(midiPath: string, trackSynthMap: TrackSynthMap, loop = true): Promise<void> {
    // 既に同じMIDIが再生中なら何もしない
    if (this.currentPath === midiPath && this.midiMode && Tone.Transport.state === 'started') {
      return
    }

    // 既存のBGMを停止
    this.stop()

    // MIDIファイルをロード
    const response = await fetch(midiPath)
    const arrayBuffer = await response.arrayBuffer()
    const midi = new Midi(arrayBuffer)

    // トラックごとにシンセとPartを作成
    midi.tracks.forEach((track, index) => {
      const synthConfig = trackSynthMap[index]
      if (!synthConfig) {
        console.warn(`Track ${index} has no synth config, skipping`)
        return
      }

      // シンセ生成
      const synth = SynthFactory.createSynth(synthConfig)
      this.synths.push(synth)

      // ノートデータをTone.Part用に変換
      const notes = track.notes.map((note) => ({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity,
      }))

      // Partを作成
      const part = new Tone.Part((time, note) => {
        synth.triggerAttackRelease(note.note, note.duration, time, note.velocity)
      }, notes)

      part.loop = loop
      if (loop && midi.duration > 0) {
        part.loopEnd = midi.duration
      }

      this.parts.push(part)
      part.start(0)
    })

    // Transport開始
    Tone.Transport.start()

    this.currentPath = midiPath
    this.midiMode = true

    console.log(`🎹 MIDI started: ${midiPath} (${midi.tracks.length} tracks)`)
  }

  /**
   * BGMを停止
   */
  stop(): void {
    // MP3停止
    if (this.player) {
      if (this.player.state === 'started') {
        this.player.stop()
      }
      this.player.dispose()
      this.player = null
    }

    // MIDI停止
    if (this.midiMode) {
      Tone.Transport.stop()
      Tone.Transport.cancel() // すべてのイベントをキャンセル

      this.parts.forEach((part) => part.dispose())
      this.synths.forEach((synth) => synth.dispose())

      this.parts = []
      this.synths = []
      this.midiMode = false
    }

    this.currentPath = null
  }

  /**
   * BGM音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setVolume(db: number): void {
    // MP3の音量設定
    if (this.player) {
      this.player.volume.value = db
    }

    // MIDIの音量設定（全シンセに適用）
    if (this.midiMode) {
      this.synths.forEach((synth) => {
        synth.volume.value = db
      })
    }
  }

  /**
   * 現在のBGM音量を取得
   */
  getVolume(): number {
    if (this.player) {
      return this.player.volume.value
    }
    if (this.synths.length > 0) {
      return this.synths[0].volume.value
    }
    return -6
  }

  /**
   * BGMが再生中かどうか
   */
  isPlaying(): boolean {
    if (this.midiMode) {
      return Tone.Transport.state === 'started'
    }
    return this.player?.state === 'started'
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop()
  }
}
