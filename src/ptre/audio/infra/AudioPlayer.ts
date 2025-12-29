/**
 * Audio Player
 * MP3等の音声ファイルを再生する
 * Infrastructure層: Tone.Playerのシンプルなラッパー
 */

import * as Tone from 'tone'
import type { AudioSource } from '../types'

/**
 * 音声ファイル再生クラス
 */
export class AudioPlayer {
  private player: Tone.Player | null = null
  private currentSource: AudioSource | null = null
  private loadingPath: string | null = null

  /**
   * 音声ファイルを再生
   * @param source 音声ソース設定
   */
  async play(source: AudioSource): Promise<void> {
    // 既に同じファイルが再生中またはロード中なら何もしない
    if (this.currentSource?.path === source.path || this.loadingPath === source.path) {
      return
    }

    // 既存のプレイヤーを停止
    this.stop()

    // ロード中フラグを立てる
    this.loadingPath = source.path

    try {
      // 新しいPlayerを作成
      this.player = new Tone.Player({
        url: source.path,
        loop: source.loop ?? true,
        volume: source.volume ?? -6,
        loopStart: source.loopStart ?? 0,
        loopEnd: source.loopEnd ?? 0, // 0の場合は曲の終わりまで
      }).toDestination()

      // ロード完了後に再生
      await this.player.load(source.path)

      // ロード中に別のファイルが指定された場合は再生しない
      if (this.loadingPath !== source.path) {
        this.player.dispose()
        this.player = null
        return
      }

      // loopEndが0の場合はバッファの長さを使用
      if (source.loopEnd === undefined || source.loopEnd === 0) {
        this.player.loopEnd = this.player.buffer.duration
      }

      this.player.start(undefined, 0)  // 常に0秒から開始（イントロ再生のため）
      this.currentSource = source
      this.loadingPath = null
    } catch (e) {
      console.warn('AudioPlayer.play error:', e)
      this.player = null
      this.currentSource = null
      this.loadingPath = null
    }
  }

  /**
   * 再生を停止
   */
  stop(): void {
    this.loadingPath = null
    if (this.player) {
      try {
        if (this.player.state === 'started') {
          this.player.stop()
        }
        this.player.dispose()
      } catch {
        // Tone.js の内部状態エラーを無視
      }
      this.player = null
    }
    this.currentSource = null
  }

  /**
   * 音量を設定
   * @param db 音量（dB）
   */
  setVolume(db: number): void {
    if (this.player) {
      this.player.volume.value = db
    }
  }

  /**
   * 再生中かどうか
   */
  isPlaying(): boolean {
    if (!this.player) return false
    return this.player.state === 'started'
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop()
  }
}
