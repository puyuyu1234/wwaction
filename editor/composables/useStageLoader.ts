import { ref } from 'vue'

import type { StageDataInput, StageTheme } from '../../src/game/types'

export interface LoadedStage {
  layers: string[][][]
  theme: StageTheme
}

export function useStageLoader() {
  const selectedStage = ref<number>(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * ステージデータを読み込む
   * @returns layers（レイヤー配列）とtheme
   */
  async function loadStage(stageNumber: number): Promise<LoadedStage> {
    isLoading.value = true
    error.value = null

    try {
      const numStr = stageNumber.toString().padStart(2, '0')
      const response = await fetch(`/stages/stage-${numStr}.json`)

      if (!response.ok) {
        throw new Error(`Stage ${numStr} not found`)
      }

      const json: StageDataInput = await response.json()
      // 各レイヤーの各行をsplitして文字配列に変換
      const layers = json.layers.map((layer) => layer.map((row) => row.split('')))

      return {
        layers,
        theme: json.theme ?? 'plain',
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      error.value = errorMessage
      console.error(`Failed to load stage ${stageNumber}:`, errorMessage)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ステージデータを保存する
   */
  async function saveStage(stageNumber: number, data: string[][][]): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const numStr = stageNumber.toString().padStart(2, '0')
      const response = await fetch('/api/save-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: numStr,
          data
        })
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      error.value = errorMessage
      console.error(`Failed to save stage ${stageNumber}:`, errorMessage)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    selectedStage,
    isLoading,
    error,
    loadStage,
    saveStage
  }
}
