import { ref, computed } from 'vue'

import { EDITOR_CONFIG } from '../../src/game/config'

export function useStageEditor() {
  const stageData = ref<string[][]>([])
  const selectedTile = ref<string>(' ')

  /**
   * 実際のステージサイズを計算（空白を除く最大範囲）
   */
  const stageSize = computed(() => {
    let maxX = 0
    let maxY = 0

    for (let y = 0; y < stageData.value.length; y++) {
      const row = stageData.value[y]
      if (!row) continue

      for (let x = 0; x < row.length; x++) {
        const tile = row[x]
        if (tile && tile !== ' ') {
          maxX = Math.max(maxX, x + 1)
          maxY = Math.max(maxY, y + 1)
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
   * 指定座標のタイルを取得
   */
  function getTile(x: number, y: number): string | undefined {
    return stageData.value[y]?.[x]
  }

  /**
   * 配列を拡張（0始まりのまま、先頭/末尾に挿入）
   */
  function expandStageData(targetX: number, targetY: number) {
    // 現在の最大幅を計算
    const currentMaxWidth =
      stageData.value.length > 0
        ? Math.max(...stageData.value.map((row) => row.length))
        : EDITOR_CONFIG.DEFAULT_WIDTH

    // 下方向への拡張（正のY）
    while (stageData.value.length <= targetY) {
      stageData.value.push(new Array(currentMaxWidth).fill(' '))
    }

    // 右方向への拡張（正のX）
    if (!stageData.value[targetY]) {
      stageData.value[targetY] = []
    }
    while (stageData.value[targetY].length <= targetX) {
      stageData.value[targetY].push(' ')
    }

    // 全行の幅を揃える
    const maxWidth = Math.max(
      currentMaxWidth,
      stageData.value[targetY].length,
    )
    stageData.value.forEach((row) => {
      while (row.length < maxWidth) {
        row.push(' ')
      }
    })
  }

  /**
   * 指定座標にタイルを配置（配列自動拡張込み）
   * 負の座標の場合は配列の先頭に挿入して全体をシフト
   */
  function setTile(x: number, y: number, tile: string) {
    console.log('[useStageEditor.setTile] called:', { x, y, tile })

    // 範囲チェックなし（メモリの許す限り無制限）

    let adjustedX = x
    let adjustedY = y

    // 負のY座標の場合: 配列の先頭に行を挿入
    if (adjustedY < 0) {
      const insertCount = Math.abs(adjustedY)
      console.log('[useStageEditor.setTile] 上方向に拡張:', insertCount)

      const currentWidth =
        stageData.value.length > 0
          ? Math.max(...stageData.value.map((row) => row.length))
          : EDITOR_CONFIG.DEFAULT_WIDTH

      // 先頭に空行を挿入
      for (let i = 0; i < insertCount; i++) {
        stageData.value.unshift(new Array(currentWidth).fill(' '))
      }

      adjustedY = 0 // 挿入後は0行目になる
    }

    // 負のX座標の場合: 全行の先頭に列を挿入
    if (adjustedX < 0) {
      const insertCount = Math.abs(adjustedX)
      console.log('[useStageEditor.setTile] 左方向に拡張:', insertCount)

      stageData.value.forEach((row) => {
        for (let i = 0; i < insertCount; i++) {
          row.unshift(' ')
        }
      })

      adjustedX = 0 // 挿入後は0列目になる
    }

    // 正の座標への拡張（既存のロジック）
    expandStageData(adjustedX, adjustedY)

    // リアクティブ性を保持するため新しい配列を作成
    const newData = [...stageData.value]
    newData[adjustedY] = [...newData[adjustedY]]
    newData[adjustedY][adjustedX] = tile
    stageData.value = newData

    console.log('[useStageEditor.setTile] after set:', {
      adjustedX,
      adjustedY,
      dataSize: `${stageData.value.length}x${stageData.value[0]?.length || 0}`,
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

  return {
    stageData,
    selectedTile,
    stageSize,
    getTile,
    setTile,
    pickTile,
  }
}
