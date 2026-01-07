import { ref, computed } from 'vue'

import { getBlockData } from '../../src/game/config'
import type { BlockDataMap, StageTheme } from '../../src/game/types'

/**
 * エディタのグローバル状態管理
 * モジュールスコープでシングルトンとして状態を保持
 */
const theme = ref<StageTheme>('plain')

const blockData = computed<BlockDataMap>(() => getBlockData(theme.value))

export function useEditorState() {
  function setTheme(newTheme: StageTheme) {
    theme.value = newTheme
  }

  return {
    theme,
    blockData,
    setTheme,
  }
}
