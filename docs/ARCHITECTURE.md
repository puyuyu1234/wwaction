# TypeScript ゲームエンジン アーキテクチャ設計書

## 📐 プロジェクト概要

このドキュメントは、既存のJavaScriptゲームエンジン ([engine.js](../engine.js), [entity.js](../entity.js)) を TypeScript に移植し、テスト駆動開発(TDD)を実現するための設計書です。

### 設計目標

- ✅ **テスト駆動開発**: すべてのゲームロジックがユニットテスト可能
- ✅ **GPU描画**: PixiJSでCanvas2Dよりも高速な描画を実現
- ✅ **既存コード活用**: engine.js/entity.js から再利用可能な部分を最大限活用
- ✅ **型安全性**: TypeScript による静的型チェック
- ✅ **MIDIループ再生**: Tone.jsでなめらかなループを実現

---

## 🗂️ ディレクトリ構造

```
game-ts/
├── src/
│   ├── core/           # エンジンコア (engine.jsから移植)
│   │   ├── Rectangle.ts        # AABB基礎クラス
│   │   ├── Rectangle.spec.ts   # テスト
│   │   ├── EventDispatcher.ts  # Pub/Sub イベントシステム
│   │   ├── EventDispatcher.spec.ts  # テスト
│   │   ├── GameEvent.ts        # イベントデータ
│   │   ├── Input.ts            # 入力管理 (キーボード・マウス)
│   │   └── Game.ts             # ゲームループ
│   │
│   ├── actor/          # アクターシステム (描画とロジックの分離)
│   │   ├── Actor.ts            # ベースアクター
│   │   ├── Actor.spec.ts       # テスト
│   │   ├── SpriteActor.ts      # スプライト描画
│   │   ├── SpriteActor.spec.ts # テスト
│   │   ├── TextActor.ts        # テキスト描画
│   │   ├── LayerActor.ts       # レイヤー管理
│   │   └── index.ts            # エクスポート
│   │
│   ├── components/     # 再利用可能なComponent (Phase 2)
│   │   ├── PhysicsComponent.ts  # 物理演算
│   │   ├── PhysicsComponent.spec.ts  # テスト
│   │   ├── TilemapCollisionComponent.ts  # タイルマップ衝突判定
│   │   └── TilemapCollisionComponent.spec.ts  # テスト
│   │
│   ├── scene/          # シーン管理
│   │   ├── Scene.ts            # ベースシーン
│   │   ├── StageScene.ts       # ステージシーン
│   │   └── TitleScene.ts       # タイトルシーン
│   │
│   ├── entity/         # ゲームエンティティ
│   │   ├── Entity.ts           # ベースエンティティ (Component統合)
│   │   ├── Entity.spec.ts      # テスト
│   │   ├── Player.ts           # プレイヤー
│   │   ├── Player.spec.ts      # テスト
│   │   ├── Wind.ts             # 風
│   │   ├── Wind.spec.ts        # テスト
│   │   ├── Enemy.ts            # 敵
│   │   └── index.ts
│   │
│   ├── resources/      # リソース管理
│   │   ├── ImageLoader.ts      # 画像ロード
│   │   ├── SpriteData.ts       # スプライトシート
│   │   ├── AudioManager.ts     # Tone.js MIDI再生
│   │   └── index.ts
│   │
│   ├── renderer/       # 描画システム (PixiJS統合)
│   │   └── PixiRenderer.ts     # PixiJS ラッパー (Container=カメラ)
│   │
│   ├── game/           # ゲーム固有ロジック (param.js, util.js移植)
│   │   ├── config.ts           # BLOCKSIZE, BLOCKDATA, STAGEDATA
│   │   ├── types.ts            # BlockData, StageData, EntityData
│   │   ├── example.spec.ts     # テスト例
│   │   └── utils.ts            # makeRangeWithEnd, easing関数
│   │
│   ├── main.ts         # エントリーポイント
│   └── App.vue         # Vue コンポーネント
```

**注**: テストファイル(*.spec.ts)は各モジュールと同じディレクトリに配置します
```

---

## 🔧 技術スタック

| 機能 | ライブラリ | サイズ (minified) | 理由 |
|------|-----------|------------------|------|
| **描画** | PixiJS v8 | ~400-600KB | GPU描画、高速、カメラはContainer transform |
| **BGM** | Tone.js + @tonejs/midi | ~100KB + ~30KB | MIDIループを滑らかに再生 |
| **物理・衝突** | 自作 (AABB) | 0KB | タイルマップ、Rectangle.hitTest() |
| **テスト** | Vitest + jsdom | 0KB (dev) | Vue/Vite統合、ヘッドレステスト |

**合計バンドルサイズ**: ~630-730KB (Phaser ~1000KB より 30%軽量)

### ライブラリ選定理由

#### PixiJS採用
- **GPU描画**: WebGLでCanvas2Dより高速 (特に大量スプライト時)
- **カメラシステム**: `Container`の`position/scale/rotation`で実現
- **既存コードとの統合**: `Actor.render()`内でPixi Spriteを更新
- **テスト**: ロジックはPixi不要、描画テストは`@pixi/node`使用検討

#### Tone.js必須
- **MIDIループ**: `@tonejs/midi`でMIDIファイル解析
- **滑らかなループ**: `Transport`でループポイント制御
- **既存の`SoundLoader`を置き換え**: Web Audio API直接使用より高機能

#### 不要なライブラリ
- ❌ **SAT.js**: 現状は全てAABB衝突判定で十分
- ❌ **Howler.js**: Tone.jsだけで効果音も再生可能
- ❌ **空間ハッシュ**: エンティティ数が少ない (プレイヤー1+風2+敵数体)

---

## 📚 既存コードからの移植マッピング

### param.js からの移植 (Phase 0)

| 既存要素 | 移植先 | 移植方法 | 優先度 |
|---------|--------|---------|--------|
| `BLOCKSIZE` | `game/config.ts` | `export const` | ⭐⭐⭐ |
| `HPDATA` | `game/config.ts` | `export const` | ⭐⭐ |
| `BlockData` | `game/types.ts` | `class`/`interface` | ⭐⭐⭐ |
| `BLOCKDATA` | `game/config.ts` | `export const` | ⭐⭐⭐ |
| `StageData` | `game/types.ts` | `class`/`interface` | ⭐⭐⭐ |
| `STAGEDATA` | `game/config.ts` | `export const` (関数化) | ⭐⭐⭐ |
| `FONT` | `game/config.ts` | `export const` | ⭐ |
| `TalkText` | `game/types.ts` | `class` | ⭐ |

### util.js からの移植 (Phase 0)

| 既存関数 | 移植先 | 移植方法 | 優先度 |
|---------|--------|---------|--------|
| `clamp()` | `game/utils.ts` | そのまま | ⭐⭐⭐ |
| `makeRangeWithEnd()` | `game/utils.ts` | そのまま (Entity.update()で使用) | ⭐⭐⭐ |
| `lerp()` | `game/utils.ts` | そのまま | ⭐⭐ |
| `easeLinear()` | `game/utils.ts` | そのまま | ⭐⭐ |
| `easeOutExpo()` | `game/utils.ts` | StageScene演出用 | ⭐ |
| `easeOutSine()` | `game/utils.ts` | StageScene演出用 | ⭐ |
| `easeInSine()` | `game/utils.ts` | StageScene演出用 | ⭐ |
| `isBlock()` | `game/utils.ts` | 不要かも (使用箇所要確認) | - |

### engine.js からの移植

| 既存クラス | 移植先 | 移植方法 | 優先度 |
|-----------|--------|---------|--------|
| `Rectangle` | `core/Rectangle.ts` | ほぼそのまま (型追加のみ) | ⭐⭐⭐ |
| `EventDispatcher` | `core/EventDispatcher.ts` | ほぼそのまま (ジェネリクス追加) | ⭐⭐⭐ |
| `GameEvent` | `core/GameEvent.ts` | そのまま | ⭐⭐⭐ |
| `Camera` | ❌ 廃止 | PixiJS Container に置き換え | - |
| `Actor` | `actor/Actor.ts` | 型定義追加 + PixiJS統合 | ⭐⭐⭐ |
| `SpriteActor` | `actor/SpriteActor.ts` | PixiJS Sprite使用 | ⭐⭐⭐ |
| `LayerActor` | `actor/LayerActor.ts` | PixiJS Container使用 | ⭐⭐ |
| `Scene` | `scene/Scene.ts` | 型定義追加 | ⭐⭐ |
| `Game` | `core/Game.ts` | Fixed timestepそのまま | ⭐⭐ |
| `Input` | `core/Input.ts` | 型定義追加 | ⭐⭐⭐ |
| `ImageLoader` | `resources/ImageLoader.ts` | PixiJS Assets に置き換え検討 | ⭐⭐ |
| `SpriteData` | `resources/SpriteData.ts` | PixiJS Spritesheet形式に変換 | ⭐⭐ |
| `SoundLoader` | `resources/AudioManager.ts` | Tone.js に置き換え | ⭐⭐ |

### entity.js からの移植

| 既存クラス | 移植先 | 移植方法 | 優先度 |
|-----------|--------|---------|--------|
| `EntityBehavior` | `entity/EntityBehavior.ts` | イベント関数群を型安全に | ⭐⭐⭐ |
| `Entity` | `entity/Entity.ts` | 型定義追加、stage: string[][] | ⭐⭐⭐ |
| `Player` | `entity/Player.ts` | 型定義追加 | ⭐⭐⭐ |
| `Wind` | `entity/Wind.ts` | 型定義追加 | ⭐⭐⭐ |
| `Nasake` | `entity/Enemy.ts` | 敵クラスにまとめる | ⭐⭐ |

---

## 🎯 実装フェーズ

### Phase 0: 基盤整備 (最優先)

**目標**: param.js/util.js を移植して、Entity実装の土台を作る

#### 0.1 型定義
- **ファイル**: `src/game/types.ts`
- **テスト**: `tests/game/config.spec.ts`
- **内容**:
  ```typescript
  interface IBlockData {
    frame: number[]
    type: number
    param?: {
      hitbox?: Rectangle
      damage?: number
      freq?: number
      loop?: boolean
      layer?: string
      alpha?: number
    }
  }

  interface IStageData {
    name: string
    engName: string
    stages: string[][]
    bg: string[]
    fg: string[]
    param?: { boss?: any }
  }

  type BlockMap = Record<string, IBlockData>
  ```

#### 0.2 定数とデータ
- **ファイル**: `src/game/config.ts`
- **テスト**: `tests/game/config.spec.ts`
- **内容**:
  ```typescript
  export const BLOCKSIZE = 16
  export const HPDATA = [7, 5, 3, 5]
  export const BLOCKDATA: BlockMap = { /* ... */ }
  export const STAGEDATA: IStageData[] = [ /* ... */ ]
  export const FONT = "'MS Gothic', ...'"
  ```

#### 0.3 ユーティリティ関数
- **ファイル**: `src/game/utils.ts`
- **テスト**: `tests/game/utils.spec.ts`
- **内容**: clamp, makeRangeWithEnd, lerp, easing関数

---

### Phase 1: コア機能 (完全テスト可能)

**目標**: ゲームロジックがブラウザなしで動作する

#### 1.1 Rectangle + AABB衝突判定
- **ファイル**: `src/core/Rectangle.ts`
- **テスト**: `tests/core/Rectangle.spec.ts`
- **内容**:
  ```typescript
  class Rectangle {
    hitTest(other: Rectangle): boolean
    contain(x: number, y: number): boolean
    clone(): Rectangle
    // getters: left, right, top, bottom, centerX, centerY
  }
  ```

#### 1.2 EventDispatcher
- **ファイル**: `src/core/EventDispatcher.ts`
- **テスト**: `tests/core/EventDispatcher.spec.ts`
- **内容**: on, off, once, dispatch, clearEvents

#### 1.3 Entity + EntityBehavior
- **ファイル**: `src/entity/Entity.ts`, `src/entity/EntityBehavior.ts`
- **テスト**: `tests/entity/Entity.spec.ts`
- **内容**: 重力、速度、壁衝突判定
- **依存**: BLOCKSIZE, BLOCKDATA, makeRangeWithEnd (Phase 0)

#### 1.4 TilemapCollision
- **ファイル**: `src/physics/TilemapCollision.ts`
- **テスト**: `tests/physics/TilemapCollision.spec.ts`
- **内容**: `isWall(x, y)` ロジック (Entityクラス内に統合)

---

### Phase 2: ゲームエンティティ (TDD)

**目標**: プレイヤーと風の挙動をテストで検証

#### 2.1 Player
- **ファイル**: `src/entity/Player.ts`
- **テスト**: `tests/entity/Player.spec.ts`
- **テストケース**:
  - ✅ 左右移動 (a/d キー)
  - ✅ ジャンプ (w キー)
  - ✅ しゃがみ (s キー)
  - ✅ 風発射 (space キー)
  - ✅ 重力適用
  - ✅ コヨーテタイム

#### 2.2 Wind
- **ファイル**: `src/entity/Wind.ts`
- **テスト**: `tests/entity/Wind.spec.ts`
- **テストケース**:
  - ✅ 水平移動 (vx)
  - ✅ 重力適用
  - ✅ 壁で跳ね返る (左右)
  - ✅ 天井・床で速度0

#### 2.3 Enemy
- **ファイル**: `src/entity/Enemy.ts`
- **テスト**: `tests/entity/Enemy.spec.ts`

---

### Phase 3: 統合・描画

**目標**: ブラウザで実際にプレイ可能にする

#### 3.1 Scene
- **ファイル**: `src/scene/Scene.ts`
- **内容**: アクター管理、update/render ループ

#### 3.2 Game
- **ファイル**: `src/core/Game.ts`
- **内容**: Fixed timestep ループ、FPS管理

#### 3.3 PixiRenderer
- **ファイル**: `src/renderer/PixiRenderer.ts`
- **内容**: PixiJS 統合、スプライト描画

#### 3.4 AudioManager
- **ファイル**: `src/resources/AudioManager.ts`
- **内容**: Tone.js (MIDI) + Howler.js (MP3) 統合

---

## 🧪 TDD 戦略

### テストパターン例

```typescript
// tests/entity/Wind.spec.ts
import { describe, it, expect } from 'vitest'
import { Wind } from '@/entity/Wind'

describe('Wind Entity', () => {
  it('should move horizontally with given velocity', () => {
    const stage = [[0, 0], [0, 0]]
    const wind = new Wind(0, 0, 2, stage)

    wind.update()

    expect(wind.x).toBe(2)
    expect(wind.vx).toBe(2)
  })

  it('should apply gravity every frame', () => {
    const stage = [[0, 0], [0, 0]]
    const wind = new Wind(0, 0, 2, stage)

    wind.update()

    expect(wind.vy).toBe(0.125) // gravity = 0.125
  })

  it('should bounce back when hitting right wall', () => {
    const stage = [[1, 1, 1], [0, 0, 1]] // 右に壁
    const wind = new Wind(0, 0, 2, stage)

    wind.x = 14 // 次のupdateで壁に当たる (BLOCKSIZE=16)
    wind.update()

    expect(wind.vx).toBe(-2) // 反転
  })
})
```

### モック戦略

- **タイルマップ**: 小さな2D配列 `string[][]` でテスト (BLOCKDATAと組み合わせ)
  ```typescript
  const testStage = [
    ['a', 'a', 'a'], // 'a' は壁 (type=1)
    [' ', ' ', 'a'],
  ]
  ```
- **入力**: `Input` クラスをモック化
  ```typescript
  const mockInput = {
    getKey: vi.fn((key: string) => 0)
  } as unknown as Input
  ```
- **描画**: テスト時は `render()` を呼ばない (ロジックのみテスト)
- **PixiJS**: テスト時は不要 (Actorロジックのみテスト)

---

## 🔄 TypeScript 移植パターン

### Before (JavaScript)

```javascript
class Entity extends SpriteActor {
  constructor(imageKey, rectangle, hitbox, stage) {
    super(imageKey, rectangle)
    this.hitbox = hitbox
    this.stage = stage
    this.vx = 0
    this.vy = 0
  }
}
```

### After (TypeScript)

```typescript
interface IHitbox {
  x: number
  y: number
  width: number
  height: number
}

class Entity extends SpriteActor {
  protected hitbox: IHitbox
  protected vx: number = 0
  protected vy: number = 0
  protected stage: number[][]

  constructor(
    imageKey: string,
    rectangle: Rectangle,
    hitbox: IHitbox,
    stage: number[][]
  ) {
    super(imageKey, rectangle)
    this.hitbox = hitbox
    this.stage = stage
  }

  get currentHitbox(): Rectangle {
    return new Rectangle(
      this.x + this.hitbox.x,
      this.y + this.hitbox.y,
      this.hitbox.width,
      this.hitbox.height
    )
  }
}
```

---

## 📊 パフォーマンス戦略

### 衝突判定

**現状**: 総当たりAABB判定で十分
- エンティティ数: プレイヤー1 + 風2 + 敵数体 = 最大10体程度
- 衝突チェック数: 10 × 10 / 2 = 50回未満
- **結論**: 空間ハッシュやSAT.jsは不要

| 手法 | 必要性 | 理由 |
|------|--------|------|
| AABB (`Rectangle.hitTest()`) | ⭐⭐⭐ | 現状で十分高速 |
| タイルマップ衝突 (`isWall()`) | ⭐⭐⭐ | 必須 |
| 空間ハッシュ | ❌ | オーバーエンジニアリング |
| SAT.js | ❌ | 複雑な形状がない |

### 描画パフォーマンス

**PixiJS採用の恩恵**:
- WebGL GPU描画 → Canvas2Dより高速 (特にスプライト数が多い時)
- Batch rendering → ドローコール削減
- カメラ移動 → Container transformで即座に反映

**注意点**:
- テスト時はPixi不要 → ロジックのみテスト
- 初回ロードサイズ: 600KBだが、描画ボトルネック回避を優先

---

## 🚀 次のアクション

### 推奨実装順序

**Phase 0 から開始** (最優先)
1. `game/types.ts` - BlockData, StageData の型定義
2. `game/config.ts` - BLOCKSIZE, BLOCKDATA, STAGEDATA
3. `game/utils.ts` - makeRangeWithEnd, clamp, easing関数

**Phase 1 (コアロジック)**
4. `core/Rectangle.ts` + テスト
5. `core/EventDispatcher.ts` + テスト
6. `entity/EntityBehavior.ts` + テスト
7. `entity/Entity.ts` + テスト (isWall含む)

**Phase 2 (ゲームエンティティ)**
8. `entity/Wind.ts` + テスト
9. `entity/Player.ts` + テスト
10. `entity/Enemy.ts` + テスト

**Phase 3 (統合)**
11. PixiJS統合 (Actor, Scene, Game)
12. Tone.js統合 (AudioManager)

### 必要なpackage.json更新

```bash
pnpm add pixi.js tone @tonejs/midi
```

**バンドルサイズ合計**: ~630-730KB

---

## 📖 参考リンク

### 元のコードベース
- [engine.js](../engine.js) - ゲームエンジン本体
- [entity.js](../entity.js) - Entity, Player, Wind実装
- [param.js](../param.js) - BLOCKDATA, STAGEDATA定義
- [util.js](../util.js) - ユーティリティ関数

### プロジェクト内ドキュメント
- [README.md](./README.md) - エレベーターピッチ
- [package.json](./package.json) - 依存関係

### ライブラリドキュメント
- [PixiJS v8](https://pixijs.com/) - GPU描画エンジン
- [Tone.js](https://tonejs.github.io/) - Web Audio フレームワーク
- [@tonejs/midi](https://github.com/Tonejs/Midi) - MIDIファイルパーサー
- [Vitest](https://vitest.dev/) - テストフレームワーク

---

**最終更新**: 2025-10-25 (レビュー反映版)
