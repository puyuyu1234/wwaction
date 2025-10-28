# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

TypeScript + Vue 3 + PixiJS で構築された2Dアクションゲームエンジン。
Phaserのような重厚なフレームワークに頼らず、必要な機能のみを組み合わせた軽量・テスト駆動開発可能なアーキテクチャ。

## 開発コマンド

### 基本操作
```bash
# 開発サーバー起動
pnpm dev

# ビルド（型チェック含む）
pnpm build

# プレビュー
pnpm preview
```

### テスト
```bash
# テスト実行（watch mode）
pnpm test

# テスト実行（1回のみ）
pnpm test:run

# テストUI起動（ブラウザベース）
pnpm test:ui

# 単一テストファイル実行
pnpm test:run src/components/PhysicsComponent.spec.ts
```

### コード品質
```bash
# Lint実行
pnpm lint

# Lint自動修正
pnpm lint:fix

# フォーマット
pnpm format

# フォーマットチェック（CI用）
pnpm format:check

# 型チェック
pnpm typecheck
```

## アーキテクチャ

### 設計哲学

**Component風継承アーキテクチャ**を採用：
- Entity（SpriteActor継承）が基底クラス
- PhysicsComponent / TilemapCollisionComponentなど、再利用可能なComponentを所有
- イベント駆動ではなく直接メソッド呼び出し（テスト容易性重視）
- ECSのSystemパターンではなく、EntityがComponentを内包する形式

### レイヤー構造

```
core/           # エンジンコア (Game, Input, Rectangle, EventDispatcher)
actor/          # 描画アクター (Actor, SpriteActor, HPBar)
components/     # 再利用可能なロジック (Physics, TilemapCollision, CollisionReaction)
entity/         # ゲームエンティティ (Entity基底 → Player, Wind, Enemy派生)
scene/          # シーン管理 (Scene基底 → StageScene派生)
game/           # ゲーム固有定数 (config.ts, types.ts)
```

### 技術スタック

- **描画**: PixiJS v8（WebGL GPU描画、軽量）
- **物理**: 自作AABB衝突判定（空間ハッシュ不要、エンティティ数が少ない）
- **タイルマップ衝突**: TilemapCollisionComponent（グリッドベース最適化）
- **テスト**: Vitest + jsdom（ロジックのみテスト、描画は統合時）

### 重要な設計パターン

#### 1. Component統合パターン
```typescript
// Entityがロジック用Componentを保持
class Entity extends SpriteActor {
  protected physics: PhysicsComponent
  protected collision: TilemapCollisionComponent

  update() {
    this.physics.applyGravity()
    if (this.collision.checkDownWall()) {
      this.collision.stopAtDownWall()
    }
    this.physics.applyVelocity()
  }
}
```

#### 2. タグベース衝突反応
```typescript
// CollisionReactionComponent がタグで反応を判定
entity.addTag('player')
wind.addTag('wind')
enemy.addTag('enemy')

// StageScene が全エンティティ間衝突をチェック
entities.forEach((a, b) => {
  if (a.currentHitbox.hitTest(b.currentHitbox)) {
    a.handleCollision(b) // タグベースで反応
  }
})
```

#### 3. Fixed Timestep ゲームループ
```typescript
// Game.ts が 60fps 固定でロジック更新
// accumulator方式でスパイクを吸収、PixiJS描画は自動実行
```

## テスト戦略

### テストコード規約
- **テストコードは日本語で記述**
- `describe` / `it` の説明は日本語
- コメントも日本語で統一

### テストパターン

#### ロジックテスト（ブラウザ不要）
```typescript
// Component単体テスト
describe('PhysicsComponent', () => {
  it('重力を適用する', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 }
    const physics = new PhysicsComponent(entity)
    physics.applyGravity()
    expect(entity.vy).toBe(0.125)
  })
})

// タイルマップ衝突テスト
const testStage = [
  ['a', ' ', ' '], // 'a' = 壁 (BLOCKDATA定義)
  [' ', ' ', ' ']
]
const wind = new Wind(20, 0, -5, testStage)
wind.update()
expect(wind.vx).toBe(5) // 左壁で跳ね返る
```

#### 描画テスト（統合時）
- PixiJSは初期化が必要なため、ロジックテストでは不要
- 描画は実際にブラウザで動作確認

## ファイル構造の原則

- **テストファイルは同じディレクトリに配置** (`*.spec.ts`)
- **エクスポートは index.ts 不要** (直接インポート推奨)
- **型定義は types.ts に集約**
- **定数は config.ts に集約**

## 開発時の注意点

### 1. Phase実装順序を守る
プロジェクトは段階的に実装されています：
- Phase 0: 基盤（config, types, utils）
- Phase 1: コア（Rectangle, EventDispatcher, Entity基底）
- Phase 2: Component実装（Physics, TilemapCollision）
- Phase 3: 統合（PixiJS描画、Scene、Game）

### 2. PixiJS v8 の非同期初期化
```typescript
// PixiJS v8 は Application.init() が非同期
await game.init()
game.changeScene(new StageScene(...))
game.start()
```

### 3. タイルマップ座標系
- ステージデータは `string[][]` (y軸が配列のインデックス順)
- `stage[y][x]` でアクセス
- BLOCKSIZE = 16px（固定）

### 4. 衝突判定の2段階構造
- **タイルマップ衝突**: TilemapCollisionComponent（グリッド最適化）
- **エンティティ間衝突**: Rectangle.hitTest()（総当たりで十分）

### 5. パフォーマンス最適化は不要
- エンティティ数は最大10体程度
- 空間ハッシュ、SAT.js、QuadTreeなどは過剰設計

## 参考ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md) - 詳細設計書、移植マッピング
- [PHASE2.md](PHASE2.md) - Component風継承の設計思想
- [README.md](README.md) - プロジェクト概要、技術選定理由
