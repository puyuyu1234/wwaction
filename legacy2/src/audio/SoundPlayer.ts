import * as Tone from 'tone'

import type { SoundEffectConfig } from './types'

/**
 * 効果音再生クラス
 * Tone.Playerを使ってMP3をワンショット再生
 */
export class SoundPlayer {
  private players = new Map<string, Tone.Player>()
  private volume = 0 // dB単位のSE全体音量

  /**
   * 効果音をプリロード
   * @param sounds 効果音マップ { キー: ファイルパス }
   */
  async load(sounds: Record<string, string | SoundEffectConfig>): Promise<void> {
    const promises = Object.entries(sounds).map(async ([key, config]) => {
      const path = typeof config === 'string' ? config : config.path
      const baseVolume = typeof config === 'string' ? 0 : (config.volume ?? 0)

      const player = new Tone.Player({
        url: path,
        volume: baseVolume + this.volume, // SE全体音量を加算
      }).toDestination()

      await player.load(path)
      this.players.set(key, player)
    })

    await Promise.all(promises)
  }

  /**
   * 効果音を再生
   * @param key 効果音キー
   */
  play(key: string): void {
    const player = this.players.get(key)
    if (!player) {
      console.warn(`Sound effect "${key}" not found`)
      return
    }

    // 既に再生中なら停止してから再生（重複防止）
    if (player.state === 'started') {
      player.stop()
    }
    player.start()
  }

  /**
   * 全効果音を停止
   */
  stopAll(): void {
    this.players.forEach((player) => {
      if (player.state === 'started') {
        player.stop()
      }
    })
  }

  /**
   * SE全体の音量を設定
   * @param db 音量（dB、-Infinityから0まで）
   */
  setVolume(db: number): void {
    this.volume = db
    // 既存の全Playerに適用
    this.players.forEach((player) => {
      player.volume.value = db
    })
  }

  /**
   * 現在のSE音量を取得
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.players.forEach((player) => player.dispose())
    this.players.clear()
  }
}
