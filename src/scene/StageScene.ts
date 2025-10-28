import { Graphics, Container, Text } from 'pixi.js'

import { Scene } from './Scene'

import { HPBar } from '@/actor/HPBar'
import { Input } from '@/core/Input'
import { Entity } from '@/entity/Entity'
import { Nasake } from '@/entity/Nasake'
import { Nuefu } from '@/entity/Nuefu'
import { Player } from '@/entity/Player'
import { Potion } from '@/entity/Potion'
import { Wind } from '@/entity/Wind'
import { STAGEDATA, BLOCKSIZE, FONT, DEBUG } from '@/game/config'

/**
 * ステージシーン
 * プレイヤーとステージを管理（PixiJS版）
 */
export class StageScene extends Scene {
  private stage: string[][]
  private player: Player // デバッグ情報用に参照を保持
  private entities: Entity[] = [] // プレイヤーを含む全エンティティ
  private stageGraphics: Graphics
  private entitiesGraphics: Graphics
  private camera: Container
  private debugText!: Text
  private hpBar!: HPBar // HP表示（通常UI）
  private input: Input

  constructor(stageIndex: number, input: Input) {
    super()
    this.input = input

    // ステージデータ取得
    const stageData = STAGEDATA[stageIndex]
    if (!stageData?.stages?.[0]) {
      throw new Error(`Stage ${stageIndex} not found`)
    }

    // stages[0] は string[] の配列なので、それを文字の2次元配列に変換
    this.stage = stageData.stages[0].map((row) => row.split(''))

    // カメラコンテナ（スクロール用）
    this.camera = new Container()
    this.container.addChild(this.camera)

    // ステージ描画用Graphics
    this.stageGraphics = new Graphics()
    this.camera.addChild(this.stageGraphics)
    this.renderStage()

    // エンティティ描画用Graphics
    this.entitiesGraphics = new Graphics()
    this.camera.addChild(this.entitiesGraphics)

    // プレイヤー生成（ステージ内の '0' を探す）
    let playerX = 0
    let playerY = 0
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        if (this.stage[y][x] === '0') {
          playerX = x * BLOCKSIZE
          playerY = y * BLOCKSIZE
        }
      }
    }

    // プレイヤーもentitiesリストに追加（HP: 5/5で初期化）
    this.player = new Player(playerX, playerY, this.stage, input, 5, 5)
    this.entities.push(this.player)
    this.add(this.player)

    // デモ用: 風エンティティを追加
    const wind = new Wind(playerX + 100, playerY - 50, 2, this.stage)
    this.addEntity(wind)

    // デモ用: Nasakeエンティティを追加
    const nasake = new Nasake(playerX + 150, playerY, this.stage)
    this.addEntity(nasake)

    // デモ用: Potionエンティティを追加
    const potion = new Potion(playerX + 200, playerY - 32, this.stage)
    this.addEntity(potion)

    // デモ用: Nuefuエンティティを追加
    const nuefu = new Nuefu(playerX + 250, playerY, this.stage)
    this.addEntity(nuefu)

    // HP表示（通常UI - 常に表示）
    this.hpBar = new HPBar(this.player, 10, 220)
    this.container.addChild(this.hpBar.container)

    // プレイヤーのダメージイベントをリッスン
    this.player.on('playerDamage', (damage: number) => {
      this.hpBar.onDamage(damage)
    })

    // デバッグテキスト（開発時のみ表示）
    if (DEBUG) {
      this.debugText = new Text({
        text: '',
        style: {
          fontFamily: FONT,
          fontSize: 10,
          fill: 0xffffff,
        },
        resolution: 1, // ピクセルフォント用に解像度を1に固定
      })
      this.debugText.x = 5
      this.debugText.y = 25 // HP表示の下に配置
      this.debugText.roundPixels = true // ピクセル境界に配置
      this.container.addChild(this.debugText)
    }
  }

  update() {
    super.update()

    // エンティティ間の衝突判定
    this.checkCollisions()

    // エンティティ描画更新
    this.renderEntities()

    // HP表示更新
    this.hpBar.update()

    // デバッグ情報更新（開発時のみ）
    if (DEBUG) {
      this.updateDebugInfo()
    }
  }

  /**
   * エンティティをシーンに追加
   * destroyイベントをリッスンして自動削除を設定
   */
  private addEntity(entity: Entity) {
    this.entities.push(entity)
    this.add(entity)

    // destroyイベントをリッスン
    entity.on('destroy', () => {
      this.removeEntity(entity)
    })
  }

  /**
   * エンティティをシーンから削除
   */
  private removeEntity(entity: Entity) {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
    this.remove(entity)

    // すべてのイベントリスナーをクリーンアップしてメモリリークを防止
    entity.clearAllEvents()
  }

  /**
   * エンティティ間の衝突判定
   * CollisionReactionComponent を使った衝突処理
   */
  private checkCollisions() {
    // 全エンティティ同士の衝突チェック（N^2だが、エンティティ数が少ないので問題なし）
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i]
        const entityB = this.entities[j]

        // Rectangle.hitTest() を使用
        if (entityA.currentHitbox.hitTest(entityB.currentHitbox)) {
          // CollisionReactionComponent による双方向の反応処理
          entityA.handleCollision(entityB)
          entityB.handleCollision(entityA)
        }
      }
    }
  }

  /**
   * デバッグ情報更新
   */
  private updateDebugInfo() {
    const debug = this.player.getDebugInfo()
    const pressedKeys = this.input.getPressedKeys()
    const keyW = this.input.getKey('KeyW')
    const keyA = this.input.getKey('KeyA')
    const keyD = this.input.getKey('KeyD')

    this.debugText.text = [
      `HP: ${debug.hp}/${debug.maxHp} ${debug.invincible ? '[無敵]' : ''} ${debug.isDead ? '[死亡]' : ''}`,
      `x: ${debug.x}  y: ${debug.y}`,
      `vx: ${debug.vx}  vy: ${debug.vy}`,
      `coyoteTime: ${debug.coyoteTime}/${debug.coyoteTimeMax}`,
      `onGround: ${debug.onGround}`,
      `KeyW:${keyW} KeyA:${keyA} KeyD:${keyD}`,
      `Keys: ${pressedKeys.join(', ') || 'none'}`,
    ].join('\n')
  }

  /**
   * ステージ（タイルマップ）描画
   */
  private renderStage() {
    this.stageGraphics.clear()

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const block = this.stage[y][x]
        if (block === ' ' || block === '0') continue

        // デバッグ用: 壁を白で描画
        this.stageGraphics.rect(x * BLOCKSIZE, y * BLOCKSIZE, BLOCKSIZE, BLOCKSIZE)
        this.stageGraphics.fill(0xffffff)
      }
    }
  }

  /**
   * 全エンティティ描画（プレイヤー含む）
   */
  private renderEntities() {
    this.entitiesGraphics.clear()

    this.entities.forEach((entity) => {
      // エンティティの種類に応じて色を変える
      let color = 0xaaaaaa // デフォルト: グレー
      if (entity.imageKey === 'player') {
        color = 0xff0000 // プレイヤー: 赤
      } else if (entity.imageKey === 'wind') {
        color = 0x00ffff // 風: シアン
      } else if (entity.imageKey === 'nasake') {
        color = 0xff00ff // Nasake: マゼンタ
      } else if (entity.imageKey === 'potion') {
        color = 0x00ff00 // Potion: 緑
      } else if (entity.imageKey === 'nuefu') {
        color = 0xffaa00 // Nuefu: オレンジ
      }

      // エンティティ本体
      this.entitiesGraphics.rect(entity.x, entity.y, entity.width, entity.height)
      this.entitiesGraphics.fill(color)

      // ヒットボックス表示（デバッグ用）
      if (DEBUG) {
        const hitbox = entity.currentHitbox
        this.entitiesGraphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)

        // プレイヤーは緑、その他は黄色
        const strokeColor = entity.imageKey === 'player' ? 0x00ff00 : 0xffff00
        this.entitiesGraphics.stroke({ width: 1, color: strokeColor })
      }
    })
  }
}
