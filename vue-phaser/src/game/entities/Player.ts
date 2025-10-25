import Phaser from 'phaser'
import { PlayerState } from '../types'
import { PLAYER_CONFIG } from '../config'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentState: PlayerState = PlayerState.STAND
  private stateTime: number = 0
  private jumpCount: number = 1
  private coyoteTime: number = PLAYER_CONFIG.COYOTE_TIME

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')

    // シーンに追加
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 物理設定
    this.setOrigin(0, 0)
    // スプライトサイズは既に24×32なので setDisplaySize は不要

    // 物理ボディのサイズを調整
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setSize(PLAYER_CONFIG.HITBOX.WIDTH, PLAYER_CONFIG.HITBOX.HEIGHT)
      body.setOffset(PLAYER_CONFIG.HITBOX.OFFSET_X, PLAYER_CONFIG.HITBOX.OFFSET_Y)
      // 壁に押されてめり込まないようにする
      body.pushable = false
      body.setAllowDrag(false)
      body.setDrag(0, 0)
    }

    this.setCollideWorldBounds(true)
    this.setGravityY(PLAYER_CONFIG.GRAVITY)

    // プレイヤーアニメーションの設定
    this.createAnimations()
  }

  private createAnimations() {
    const scene = this.scene

    // 立ちアニメーション
    if (!scene.anims.exists('player_stand')) {
      scene.anims.create({
        key: 'player_stand',
        frames: scene.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 1] }),
        frameRate: 6,
        repeat: -1
      })
    }

    // 歩きアニメーション
    if (!scene.anims.exists('player_walk')) {
      scene.anims.create({
        key: 'player_walk',
        frames: scene.anims.generateFrameNumbers('player', { frames: [3, 4, 5, 4] }),
        frameRate: 6,
        repeat: -1
      })
    }

    // ジャンプ上昇アニメーション
    if (!scene.anims.exists('player_jumpUp')) {
      scene.anims.create({
        key: 'player_jumpUp',
        frames: scene.anims.generateFrameNumbers('player', { frames: [6, 7, 8, 7] }),
        frameRate: 6,
        repeat: -1
      })
    }

    // ジャンプ下降アニメーション
    if (!scene.anims.exists('player_jumpDown')) {
      scene.anims.create({
        key: 'player_jumpDown',
        frames: scene.anims.generateFrameNumbers('player', { frames: [9, 10, 11, 10] }),
        frameRate: 6,
        repeat: -1
      })
    }

    this.play('player_stand')
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys | null) {
    if (!cursors) return

    // 左右移動
    if (cursors.left?.isDown || this.scene.input.keyboard?.addKey('A').isDown) {
      this.setVelocityX(-PLAYER_CONFIG.SPEED)
      this.setFlipX(true)
      if (this.body?.blocked.down) {
        this.play('player_walk', true)
      }
    } else if (cursors.right?.isDown || this.scene.input.keyboard?.addKey('D').isDown) {
      this.setVelocityX(PLAYER_CONFIG.SPEED)
      this.setFlipX(false)
      if (this.body?.blocked.down) {
        this.play('player_walk', true)
      }
    } else {
      this.setVelocityX(0)
      if (this.body?.blocked.down) {
        this.play('player_stand', true)
      }
    }

    // ジャンプ
    const wKey = this.scene.input.keyboard?.addKey('W')
    if (wKey && Phaser.Input.Keyboard.JustDown(wKey)) {
      if (this.body?.blocked.down || this.coyoteTime > 0) {
        this.setVelocityY(PLAYER_CONFIG.JUMP_POWER)
        this.jumpCount = 0
      }
    }

    // アニメーション更新
    if (this.body && !this.body.blocked.down) {
      if (this.body.velocity.y < 0) {
        this.play('player_jumpUp', true)
      } else {
        this.play('player_jumpDown', true)
      }
    }

    // コヨーテタイム更新
    if (this.body?.blocked.down) {
      this.coyoteTime = PLAYER_CONFIG.COYOTE_TIME
    } else {
      this.coyoteTime--
    }

    this.stateTime++
  }
}
