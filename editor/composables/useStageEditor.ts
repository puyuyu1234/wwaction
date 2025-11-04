import { ref, computed } from 'vue'

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

    // 最低サイズを保証（20x15）
    return {
      width: Math.max(maxX, 20),
      height: Math.max(maxY, 15)
    }
  })

  /**
   * 指定座標のタイルを取得
   */
  function getTile(x: number, y: number): string | undefined {
    return stageData.value[y]?.[x]
  }

  /**
   * ステージデータを自動拡張
   */
  function expandStageData(targetX: number, targetY: number) {
    // Y方向の拡張
    while (stageData.value.length <= targetY) {
      const currentWidth = stageData.value.length > 0
        ? Math.max(...stageData.value.map(row => row.length))
        : 20
      stageData.value.push(new Array(currentWidth).fill(' '))
    }

    // X方向の拡張
    if (!stageData.value[targetY]) {
      stageData.value[targetY] = []
    }
    while (stageData.value[targetY].length <= targetX) {
      stageData.value[targetY].push(' ')
    }

    // 全行の幅を揃える
    const maxWidth = Math.max(...stageData.value.map(row => row.length))
    stageData.value.forEach(row => {
      while (row.length < maxWidth) {
        row.push(' ')
      }
    })
  }

  /**
   * 指定座標にタイルを配置（配列自動拡張込み）
   */
  function setTile(x: number, y: number, tile: string) {
    if (x < 0 || y < 0) return

    expandStageData(x, y)
    stageData.value[y][x] = tile
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
    pickTile
  }
}
