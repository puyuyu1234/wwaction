import { describe, it, expect, beforeEach } from 'vitest'

import { useStageEditor } from './useStageEditor'

describe('useStageEditor', () => {
  let editor: ReturnType<typeof useStageEditor>

  beforeEach(() => {
    editor = useStageEditor()
  })

  describe('初期状態', () => {
    it('空のステージデータで初期化される', () => {
      expect(editor.stageData.value).toEqual([])
    })

    it('選択タイルは空白で初期化される', () => {
      expect(editor.selectedTile.value).toBe(' ')
    })

    it('ステージサイズはデフォルトサイズを返す', () => {
      expect(editor.stageSize.value).toEqual({
        width: 20,
        height: 15,
      })
    })
  })

  describe('setTile - 正の座標への拡張', () => {
    it('正の座標にタイルを配置できる', () => {
      editor.setTile(5, 3, 'a')
      expect(editor.getTile(5, 3)).toBe('a')
    })

    it('右下方向にステージが拡張される', () => {
      editor.setTile(25, 20, 'b')
      expect(editor.getTile(25, 20)).toBe('b')
    })

    it('全ての行が同じ幅に揃えられる', () => {
      editor.setTile(10, 5, 'a')
      const firstRowLength = editor.stageData.value[0].length
      editor.stageData.value.forEach((row) => {
        expect(row.length).toBe(firstRowLength)
      })
    })
  })

  describe('setTile - 負の座標で左上に拡張', () => {
    it('負のX座標で左方向に拡張される', () => {
      // まず基準となるタイルを配置
      editor.setTile(0, 3, 'base')

      // 負のX座標にタイルを配置
      editor.setTile(-5, 3, 'a')

      // 配列が左に拡張され、元の(0,3)が(5,3)にシフトされる
      expect(editor.getTile(0, 3)).toBe('a')
      expect(editor.getTile(5, 3)).toBe('base')
    })

    it('負のY座標で上方向に拡張される', () => {
      // まず基準となるタイルを配置
      editor.setTile(3, 0, 'base')

      // 負のY座標にタイルを配置
      editor.setTile(3, -5, 'a')

      // 配列が上に拡張され、元の(3,0)が(3,5)にシフトされる
      expect(editor.getTile(3, 0)).toBe('a')
      expect(editor.getTile(3, 5)).toBe('base')
    })
  })

  describe('大きな座標への配置', () => {
    it('大きな座標にもタイルを配置できる（無制限）', () => {
      editor.setTile(200, 10, 'a')
      expect(editor.getTile(200, 10)).toBe('a')
    })

    it('非常に大きな座標にもタイルを配置できる', () => {
      editor.setTile(500, 300, 'b')
      expect(editor.getTile(500, 300)).toBe('b')
    })
  })

  describe('getTile', () => {
    it('存在しない座標はundefinedを返す', () => {
      expect(editor.getTile(100, 100)).toBeUndefined()
    })

    it('配置したタイルを取得できる', () => {
      editor.setTile(5, 5, 'c')
      expect(editor.getTile(5, 5)).toBe('c')
    })
  })

  describe('pickTile', () => {
    it('指定座標のタイルを選択タイルに設定する', () => {
      editor.setTile(3, 3, 'd')
      editor.pickTile(3, 3)
      expect(editor.selectedTile.value).toBe('d')
    })

    it('存在しないタイルをpickしても選択タイルは変わらない', () => {
      editor.selectedTile.value = 'e'
      editor.pickTile(100, 100)
      expect(editor.selectedTile.value).toBe('e')
    })
  })

  describe('リアクティブ性', () => {
    it('setTileでステージデータが更新されるとリアクティブに反映される', () => {
      const initialData = editor.stageData.value
      editor.setTile(5, 5, 'f')
      // 参照が変わることを確認（リアクティブ性の保証）
      expect(editor.stageData.value).not.toBe(initialData)
    })
  })

  describe('stageSize計算', () => {
    it('タイルが配置された最大範囲を計算する', () => {
      editor.setTile(10, 8, 'a')
      editor.setTile(15, 5, 'b')
      expect(editor.stageSize.value).toEqual({
        width: 20, // max(16, 20) = 20
        height: 15, // max(9, 15) = 15
      })
    })

    it('デフォルトサイズを超える配置の場合は実際のサイズを返す', () => {
      editor.setTile(25, 20, 'a')
      expect(editor.stageSize.value.width).toBeGreaterThanOrEqual(26)
      expect(editor.stageSize.value.height).toBeGreaterThanOrEqual(21)
    })
  })

  describe('空白タイルでの縮小防止', () => {
    it('タイルを空白で上書きしても配列サイズは維持される', () => {
      // タイルを配置して拡張
      editor.setTile(10, 8, 'a')
      const heightAfterExpand = editor.stageData.value.length
      const widthAfterExpand = editor.stageData.value[0].length

      // 空白で上書き
      editor.setTile(10, 8, ' ')

      // 配列サイズは変わらない（一度広げたら戻らない）
      expect(editor.stageData.value.length).toBe(heightAfterExpand)
      expect(editor.stageData.value[0].length).toBe(widthAfterExpand)
    })
  })

  describe('save/load互換性', () => {
    it('stageDataは0始まりの配列として保存できる', () => {
      editor.setTile(2, 1, 'a')
      editor.setTile(5, 3, 'b')

      // stageData.valueは0始まりの配列
      const data = editor.stageData.value
      expect(data[1][2]).toBe('a')
      expect(data[3][5]).toBe('b')
    })
  })
})
