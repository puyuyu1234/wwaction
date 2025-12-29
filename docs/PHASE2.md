# Phase 2: Component風継承アーキテクチャ設計

このドキュメントは、Phase 1 (基礎実装) の後に実装する、Component風継承ベースのゲームエンジン設計をメモしたものです。

## 設計方針

### なぜComponent風継承か?

**現在の entity.js の問題点:**
- ❌ EntityBehaviorはクロージャで`that`をキャプチャ (複雑)
- ❌ イベント駆動で間接的すぎる (`this.dispatch("gravity")`)
- ❌ テストしづらい (どのイベントが発火するかわかりにくい)
- ❌ 型安全でない

**Component風継承の利点:**
- ✅ Componentを個別にテスト可能
- ✅ 再利用性が高い (PhysicsComponentは全エンティティで共通)
- ✅ イベント駆動不要、直接メソッド呼び出し
- ✅ TypeScriptの型推論が効く
- ✅ 既存の継承構造を維持しつつ、Componentパターンの恩恵

---

## アーキテクチャ概要

```
Entity (継承ベース)
  ├── Component所有 (PhysicsComponent, CollisionComponent)
  └── update() でComponentのメソッドを直接呼び出し

Component (独立クラス)
  ├── entityへの参照を持つ (interfaceで型安全)
  └── 純粋なロジックのみ (テストしやすい)
```

**ポイント:**
- Entityは継承ツリー (Actor → SpriteActor → Entity)
- ComponentはEntityに所有される (ECSのSystemではない)
- Componentは小さく、テスト可能な単位

---

## ディレクトリ構造

```
src/
├── components/          # 再利用可能なComponent
│   ├── PhysicsComponent.ts
│   ├── TilemapCollisionComponent.ts
│   └── index.ts
│
├── core/               # エンジンコア (Phase 1で実装)
│   ├── Rectangle.ts
│   ├── EventDispatcher.ts
│   └── GameEvent.ts
│
├── actor/              # Phase 3で実装
│   ├── Actor.ts
│   └── SpriteActor.ts
│
├── entity/             # ゲームエンティティ
│   ├── Entity.ts       # Component を使う
│   ├── Player.ts
│   ├── Wind.ts
│   └── Enemy.ts
│
└── game/               # Phase 0で実装済み
    ├── types.ts
    └── config.ts

tests/
├── components/         # Component単体テスト
│   ├── PhysicsComponent.spec.ts
│   └── TilemapCollisionComponent.spec.ts
│
└── entity/             # 統合テスト
    ├── Entity.spec.ts
    ├── Wind.spec.ts
    └── Player.spec.ts
```

---

## Component設計

### 1. PhysicsComponent

```typescript
// src/components/PhysicsComponent.ts

/**
 * 物理演算Component
 * 重力と速度の適用を担当
 */
export class PhysicsComponent {
  constructor(
    private entity: {
      vx: number
      vy: number
      x: number
      y: number
    }
  ) {}

  /**
   * 重力を適用
   */
  applyGravity() {
    this.entity.vy += 0.125
  }

  /**
   * 速度を位置に適用
   */
  applyVelocity() {
    this.entity.x += this.entity.vx
    this.entity.y += this.entity.vy
  }
}

// tests/components/PhysicsComponent.spec.ts
describe('PhysicsComponent', () => {
  it('applies gravity', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 }
    const physics = new PhysicsComponent(entity)

    physics.applyGravity()

    expect(entity.vy).toBe(0.125)
  })

  it('applies velocity to position', () => {
    const entity = { x: 0, y: 0, vx: 2, vy: 3 }
    const physics = new PhysicsComponent(entity)

    physics.applyVelocity()

    expect(entity.x).toBe(2)
    expect(entity.y).toBe(3)
  })
})
```

---

### 2. TilemapCollisionComponent

```typescript
// src/components/TilemapCollisionComponent.ts
import { BLOCKSIZE, BLOCKDATA } from '@/game/config'
import { CollisionType } from '@/game/types'

export interface ICollidable {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  hitbox: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * タイルマップ衝突判定Component
 */
export class TilemapCollisionComponent {
  constructor(
    private entity: ICollidable,
    private stage: string[][]
  ) {}

  private get currentHitbox() {
    return {
      left: this.entity.x + this.entity.hitbox.x,
      right: this.entity.x + this.entity.hitbox.x + this.entity.hitbox.width - 1,
      top: this.entity.y + this.entity.hitbox.y,
      bottom: this.entity.y + this.entity.hitbox.y + this.entity.hitbox.height - 1,
    }
  }

  private isWall(x: number, y: number): boolean {
    const bx = Math.floor(x / BLOCKSIZE)
    const by = Math.floor(y / BLOCKSIZE)

    if (y < 0) return false
    if (!this.stage[by] || !this.stage[by][bx]) return false

    const blockKey = this.stage[by][bx]
    const blockType = BLOCKDATA[blockKey]?.type ?? CollisionType.NONE
    return blockType === CollisionType.SOLID || blockType === CollisionType.PLATFORM
  }

  // 左壁チェック
  checkLeftWall(): boolean {
    const hitbox = this.currentHitbox
    for (let y = hitbox.top; y <= hitbox.bottom; y += BLOCKSIZE) {
      if (this.isWall(hitbox.left - 1 + this.entity.vx, y)) {
        return true
      }
    }
    if (this.isWall(hitbox.left - 1 + this.entity.vx, hitbox.bottom)) {
      return true
    }
    return false
  }

  // 左壁で停止
  stopAtLeftWall() {
    const wallPosition = this.currentHitbox.left - 1 + this.entity.vx
    this.entity.x = (Math.floor(wallPosition / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx = 0
  }

  // 左壁で跳ね返る (Windで使用)
  bounceAtLeftWall() {
    const wallPosition = this.currentHitbox.left - 1 + this.entity.vx
    this.entity.x = (Math.floor(wallPosition / BLOCKSIZE) + 1) * BLOCKSIZE - this.entity.hitbox.x
    this.entity.vx *= -1
  }

  // 右壁、上壁、下壁も同様に実装...
}

// tests/components/TilemapCollisionComponent.spec.ts
describe('TilemapCollisionComponent', () => {
  it('detects left wall', () => {
    const stage = [
      ['a', ' ', ' '], // 'a' = PLATFORM
    ]
    const entity = {
      x: 16, y: 0, vx: -5, vy: 0,
      width: 16, height: 16,
      hitbox: { x: 0, y: 0, width: 16, height: 16 }
    }
    const collision = new TilemapCollisionComponent(entity, stage)

    expect(collision.checkLeftWall()).toBe(true)
  })

  it('stops at left wall', () => {
    const stage = [
      ['a', ' ', ' '],
    ]
    const entity = {
      x: 20, y: 0, vx: -10, vy: 0,
      width: 16, height: 16,
      hitbox: { x: 0, y: 0, width: 16, height: 16 }
    }
    const collision = new TilemapCollisionComponent(entity, stage)

    collision.stopAtLeftWall()

    expect(entity.x).toBe(16) // 壁の右側に位置調整
    expect(entity.vx).toBe(0)
  })

  it('bounces at left wall', () => {
    const stage = [
      ['a', ' ', ' '],
    ]
    const entity = {
      x: 20, y: 0, vx: -2, vy: 0,
      width: 16, height: 16,
      hitbox: { x: 0, y: 0, width: 16, height: 16 }
    }
    const collision = new TilemapCollisionComponent(entity, stage)

    collision.bounceAtLeftWall()

    expect(entity.x).toBe(16)
    expect(entity.vx).toBe(2) // 反転
  })
})
```

---

## Entity設計

### 基底Entityクラス

```typescript
// src/entity/Entity.ts
import { PhysicsComponent } from '@/components/PhysicsComponent'
import { TilemapCollisionComponent } from '@/components/TilemapCollisionComponent'
import { SpriteActor } from '@/actor/SpriteActor'
import { Rectangle } from '@/core/Rectangle'

export interface IHitbox {
  x: number
  y: number
  width: number
  height: number
}

export class Entity extends SpriteActor {
  vx = 0
  vy = 0

  protected physics: PhysicsComponent
  protected collision: TilemapCollisionComponent

  constructor(
    imageKey: string,
    rectangle: Rectangle,
    protected hitbox: IHitbox,
    protected stage: string[][]
  ) {
    super(imageKey, rectangle)

    // Component初期化
    this.physics = new PhysicsComponent(this)
    this.collision = new TilemapCollisionComponent(this, stage)
  }

  update() {
    // サブクラスでオーバーライド
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

### Windクラス

```typescript
// src/entity/Wind.ts
import { Entity } from './Entity'
import { Rectangle } from '@/core/Rectangle'

export class Wind extends Entity {
  constructor(x: number, y: number, vx: number, stage: string[][]) {
    const rect = new Rectangle(x, y, 16, 16)
    const hitbox = { x: 2, y: 1, width: 12, height: 15 }
    super('wind', rect, hitbox, stage)

    this.vx = vx
  }

  update() {
    // 重力
    this.physics.applyGravity()

    // 壁判定 (跳ね返る)
    if (this.collision.checkLeftWall() && this.vx < 0) {
      this.collision.bounceAtLeftWall()
    }
    if (this.collision.checkRightWall() && this.vx > 0) {
      this.collision.bounceAtRightWall()
    }
    if (this.collision.checkUpWall() && this.vy < 0) {
      this.collision.stopAtUpWall()
    }
    if (this.collision.checkDownWall() && this.vy > 0) {
      this.collision.stopAtDownWall()
    }

    // 速度適用
    this.physics.applyVelocity()
  }
}

// tests/entity/Wind.spec.ts
describe('Wind', () => {
  it('moves horizontally', () => {
    const stage = [[' ', ' ', ' ']]
    const wind = new Wind(0, 0, 2, stage)

    wind.update()

    expect(wind.x).toBe(2)
  })

  it('applies gravity', () => {
    const stage = [[' ', ' ', ' ']]
    const wind = new Wind(0, 0, 2, stage)

    wind.update()

    expect(wind.vy).toBe(0.125)
  })

  it('bounces back from left wall', () => {
    const stage = [['a', ' ', ' ']] // 左に壁
    const wind = new Wind(20, 0, -5, stage)

    wind.update()

    expect(wind.vx).toBe(5) // 反転
  })
})
```

---

## Phase 2 実装順序

1. **PhysicsComponent** - 重力、速度適用
2. **TilemapCollisionComponent** - 壁判定ロジック
3. **Entity基底クラス** - Componentを統合
4. **Wind** - 最初のテスト対象
5. **Player** - 入力処理を追加

---

## Phase 1 との関係

**Phase 1で準備すること:**
- ✅ Rectangle クラス (currentHitbox計算に必要)
- ✅ EventDispatcher (後方互換のため残す)
- ✅ GameEvent (後方互換のため残す)
- ⚠️ Actor, SpriteActor (Phase 2で必要だが、Phase 1では最小限実装)

**Phase 1では実装しないこと:**
- ❌ Component実装
- ❌ Entity実装
- ❌ 複雑なロジック

---

**最終更新**: 2025-10-25
