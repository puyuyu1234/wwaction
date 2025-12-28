# ptre Game Engine

## 概要
PIXI.js上に構築されたブラウザゲーム用エンジン

## 使用上の注意

### Game.create() vs GameFactory.createGame()
- **Game.create()**: Gameインスタンスのみ作成（基本的な初期化）
- **GameFactory.createGame()**: Game + AssetLoaderをセットで初期化（推奨）
  - AssetLoaderのrenderer設定も自動で行う
  - 通常はこちらを使用

### AudioService初期化
- ブラウザの音声再生制限のため、canvas.onFocusイベントで初期化が必要
- ユーザー操作後でないと音声再生できない
