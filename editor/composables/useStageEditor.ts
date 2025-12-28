import { ref, computed } from 'vue'

import { EDITOR_CONFIG } from '../config'

export function useStageEditor() {
  // 3次元配列: [layerIndex][y][x]
  const stageData = ref<string[][][]>([[]])
  const currentLayer = ref<number>(0)
  const selectedTile = ref<string>(' ')

  /**
   * 現在のレイヤーデータを取得
   */
  const currentLayerData = computed(() => {
    return stageData.value[currentLayer.value] || []
  })

  /**
   * レイヤー数
   */
  const layerCount = computed(() => stageData.value.length)

  /**
   * 実際のステージサイズを計算（全レイヤーの空白を除く最大範囲）
   */
  const stageSize = computed(() => {
    let maxX = 0
    let maxY = 0

    // 全レイヤーを走査
    for (const layer of stageData.value) {
      for (let y = 0; y < layer.length; y++) {
        const row = layer[y]
        if (!row) continue

        for (let x = 0; x < row.length; x++) {
          const tile = row[x]
          if (tile && tile !== ' ') {
            maxX = Math.max(maxX, x + 1)
            maxY = Math.max(maxY, y + 1)
          }
        }
      }
    }

    // 最低サイズを保証
    return {
      width: Math.max(maxX, EDITOR_CONFIG.DEFAULT_WIDTH),
      height: Math.max(maxY, EDITOR_CONFIG.DEFAULT_HEIGHT),
    }
  })

  /**
   * 指定座標のタイルを取得（現在のレイヤー）
   */
  function getTile(x: number, y: number): string | undefined {
    return currentLayerData.value[y]?.[x]
  }

  /**
   * 全レイヤーの指定座標のタイルを取得
   */
  function getAllLayerTiles(x: number, y: number): string[] {
    return stageData.value.map((layer) => layer[y]?.[x] || ' ')
  }

  /**
   * 配列を拡張（全レイヤー共通でサイズを揃える）
   */
  function expandStageData(targetX: number, targetY: number) {
    // 全レイヤーの最大幅と高さを計算
    let maxWidth = EDITOR_CONFIG.DEFAULT_WIDTH
    let maxHeight = 0
    for (const layer of stageData.value) {
      maxHeight = Math.max(maxHeight, layer.length)
      for (const row of layer) {
        maxWidth = Math.max(maxWidth, row.length)
      }
    }

    // ターゲット座標を考慮
    maxWidth = Math.max(maxWidth, targetX + 1)
    maxHeight = Math.max(maxHeight, targetY + 1)

    // 全レイヤーを同じサイズに拡張
    for (const layer of stageData.value) {
      // 下方向への拡張
      while (layer.length < maxHeight) {
        layer.push(new Array(maxWidth).fill(' '))
      }

      // 全行の幅を揃える
      layer.forEach((row) => {
        while (row.length < maxWidth) {
          row.push(' ')
        }
      })
    }
  }

  /**
   * 指定座標にタイルを配置（現在のレイヤー、配列自動拡張込み）
   */
  function setTile(x: number, y: number, tile: string) {
    console.log('[useStageEditor.setTile] called:', { x, y, tile, layer: currentLayer.value })

    let adjustedX = x
    let adjustedY = y

    // 負のY座標の場合: 全レイヤーの先頭に行を挿入
    if (adjustedY < 0) {
      const insertCount = Math.abs(adjustedY)
      console.log('[useStageEditor.setTile] 上方向に拡張:', insertCount)

      for (const layer of stageData.value) {
        const currentWidth =
          layer.length > 0
            ? Math.max(...layer.map((row) => row.length))
            : EDITOR_CONFIG.DEFAULT_WIDTH

        for (let i = 0; i < insertCount; i++) {
          layer.unshift(new Array(currentWidth).fill(' '))
        }
      }

      adjustedY = 0
    }

    // 負のX座標の場合: 全レイヤーの全行の先頭に列を挿入
    if (adjustedX < 0) {
      const insertCount = Math.abs(adjustedX)
      console.log('[useStageEditor.setTile] 左方向に拡張:', insertCount)

      for (const layer of stageData.value) {
        layer.forEach((row) => {
          for (let i = 0; i < insertCount; i++) {
            row.unshift(' ')
          }
        })
      }

      adjustedX = 0
    }

    // 正の座標への拡張
    expandStageData(adjustedX, adjustedY)

    // リアクティブ性を保持するため新しい配列を作成
    const newData = [...stageData.value]
    newData[currentLayer.value] = [...newData[currentLayer.value]]
    newData[currentLayer.value][adjustedY] = [...newData[currentLayer.value][adjustedY]]
    newData[currentLayer.value][adjustedY][adjustedX] = tile
    stageData.value = newData

    console.log('[useStageEditor.setTile] after set:', {
      adjustedX,
      adjustedY,
      dataSize: `${currentLayerData.value.length}x${currentLayerData.value[0]?.length || 0}`,
    })
  }

  /**
   * 指定座標のタイルを選択（スポイト機能）
   */
  function pickTile(x: number, y: number) {
    const tile = getTile(x, y)
    if (tile) {
      selectedTile.value = tile
    }
  }

  /**
   * レイヤーを追加
   */
  function addLayer() {
    // 既存レイヤーと同じサイズの空レイヤーを追加
    const baseLayer = stageData.value[0] || []
    const height = baseLayer.length || EDITOR_CONFIG.DEFAULT_HEIGHT
    const width = baseLayer[0]?.length || EDITOR_CONFIG.DEFAULT_WIDTH

    const newLayer: string[][] = []
    for (let y = 0; y < height; y++) {
      newLayer.push(new Array(width).fill(' '))
    }

    stageData.value = [...stageData.value, newLayer]
  }

  /**
   * レイヤーを削除
   */
  function removeLayer(layerIndex: number) {
    if (stageData.value.length <= 1) {
      console.warn('Cannot remove the last layer')
      return
    }

    stageData.value = stageData.value.filter((_, i) => i !== layerIndex)

    // 現在のレイヤーが削除された場合、調整
    if (currentLayer.value >= stageData.value.length) {
      currentLayer.value = stageData.value.length - 1
    }
  }

  /**
   * レイヤーを切り替え
   */
  function setCurrentLayer(layerIndex: number) {
    if (layerIndex >= 0 && layerIndex < stageData.value.length) {
      currentLayer.value = layerIndex
    }
  }

  return {
    stageData,
    currentLayer,
    currentLayerData,
    layerCount,
    selectedTile,
    stageSize,
    getTile,
    getAllLayerTiles,
    setTile,
    pickTile,
    addLayer,
    removeLayer,
    setCurrentLayer,
  }
}
