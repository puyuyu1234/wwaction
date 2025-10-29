import * as Tone from 'tone'

import { MusicPlayer } from './MusicPlayer'
import { SoundPlayer } from './SoundPlayer'
import type { TrackSynthMap } from './synth/types'
import { AudioState } from './types'
import type { MusicConfig, SoundEffectConfig } from './types'

/**
 * 音響システム統括クラス（Singleton）
 * - Tone.jsの初期化管理
 * - BGM/効果音の再生制御
 * - マスター音量管理
 */
export class AudioManager {
  private static instance: AudioManager

  private music: MusicPlayer
  private sound: SoundPlayer
  private state: AudioState = AudioState.UNINITIALIZED
  private masterVolume = -6 // dB

  private constructor() {
    this.music = new MusicPlayer()
    this.sound = new SoundPlayer()
  }

  /**
   * Singletonインスタンス取得
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * 音響システム初期化
   * Canvas Focus時に一度だけ呼ばれる
   */
  async init(): Promise<void> {
    if (this.state !== AudioState.UNINITIALIZED) {
      return
    }

    this.state = AudioState.INITIALIZING

    try {
      // クロスブラウザ対応: 同期的にresume + 非同期でstart
      if (Tone.context.state === 'suspended') {
        await Tone.context.resume()
      }
      await Tone.start()

      // マスター音量設定
      Tone.getDestination().volume.value = this.masterVolume

      this.state = AudioState.READY
      console.log('🎵 AudioManager initialized')
    } catch (error) {
      this.state = AudioState.ERROR
      console.error('Failed to initialize AudioManager:', error)
      throw error
    }
  }

  /**
   * 初期化完了しているか
   */
  isReady(): boolean {
    return this.state === AudioState.READY
  }

  /**
   * 現在の状態を取得
   */
  getState(): AudioState {
    return this.state
  }

  /**
   * 効果音をプリロード
   * @param sounds 効果音マップ { キー: ファイルパス or 設定オブジェクト }
   */
  async loadSounds(sounds: Record<string, string | SoundEffectConfig>): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioManager not ready, cannot load sounds')
      return
    }
    await this.sound.load(sounds)
  }

  /**
   * BGMを再生
   * @param config BGM設定（文字列の場合はパスとして扱う）
   */
  async playMusic(config: string | MusicConfig): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioManager not ready, music will not play')
      return
    }
    await this.music.play(config)
  }

  /**
   * BGMを停止
   */
  stopMusic(): void {
    this.music.stop()
  }

  /**
   * MIDIファイルをカスタム音源で再生
   * @param midiPath MIDIファイルパス
   * @param trackSynthMap トラック別シンセ設定
   * @param loop ループ再生するか
   */
  async playMidi(midiPath: string, trackSynthMap: TrackSynthMap, loop = true): Promise<void> {
    if (!this.isReady()) {
      console.warn('AudioManager not ready, MIDI will not play')
      return
    }
    await this.music.playMidi(midiPath, trackSynthMap, loop)
  }

  /**
   * 効果音を再生
   * @param key 効果音キー
   */
  playSound(key: string): void {
    if (!this.isReady()) {
      return // 初期化前は無音で無視
    }
    this.sound.play(key)
  }

  /**
   * マスター音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setMasterVolume(db: number): void {
    this.masterVolume = db
    if (this.isReady()) {
      Tone.getDestination().volume.value = db
    }
  }

  /**
   * BGM音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setMusicVolume(db: number): void {
    this.music.setVolume(db)
  }

  /**
   * BGM音量を取得
   */
  getMusicVolume(): number {
    return this.music.getVolume()
  }

  /**
   * SE音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setSoundVolume(db: number): void {
    this.sound.setVolume(db)
  }

  /**
   * SE音量を取得
   */
  getSoundVolume(): number {
    return this.sound.getVolume()
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.music.dispose()
    this.sound.dispose()
    this.state = AudioState.UNINITIALIZED
  }
}
