# CLAUDE.md

## プロジェクト概要

TypeScript + Vue 3 + PixiJS で構築された2Dアクションゲーム。

## ディレクトリ構成

```
src/ptre/       # ゲームエンジン（PIXI.js上に構築）
src/game/       # ゲーム本体（エンティティ、シーン等）
editor/         # Vueベースのステージエディタ（開発時のみ）
stages/         # ステージデータ（JSON）
themes/         # テーマデータ（JSON）
public/assets/  # 画像・音声アセット
```

## 開発コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # ビルド
pnpm test         # テスト（watch mode）
pnpm test:run     # テスト（1回のみ）
pnpm lint:fix     # Lint自動修正
pnpm format       # フォーマット
pnpm typecheck    # 型チェック
```

## ゲームエンジン（src/ptre）

```
core/       # Game, Input, Camera, AssetLoader, Rectangle
actor/      # SpriteActor, AnimatedSpriteActor, TextActor
scene/      # Scene基底クラス
components/ # StateManager等の再利用可能コンポーネント
audio/      # AudioService, MIDIプレイヤー
utils/      # イージング関数等
```

### 初期化パターン
```typescript
// GameFactory.createGame()を使用（推奨）
const { game, loader } = await GameFactory.createGame(container)
```

## テスト規約

- **テストコードは日本語で記述**
- describe / it の説明は日本語
- テストファイルは同じディレクトリに `*.spec.ts` として配置
