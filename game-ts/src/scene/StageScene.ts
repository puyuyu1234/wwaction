import { Graphics, Container, Text } from "pixi.js";
import { Scene } from "./Scene";
import { Player } from "@/entity/Player";
import { Wind } from "@/entity/Wind";
import { Entity } from "@/entity/Entity";
import { Input } from "@/core/Input";
import { STAGEDATA, BLOCKSIZE, FONT, DEBUG } from "@/game/config";

/**
 * ステージシーン
 * プレイヤーとステージを管理（PixiJS版）
 */
export class StageScene extends Scene {
  private stage: string[][];
  private player: Player; // デバッグ情報用に参照を保持
  private entities: Entity[] = []; // プレイヤーを含む全エンティティ
  private stageGraphics: Graphics;
  private entitiesGraphics: Graphics;
  private camera: Container;
  private debugText!: Text;
  private input: Input;

  constructor(stageIndex: number, input: Input) {
    super();
    this.input = input;

    // ステージデータ取得
    const stageData = STAGEDATA[stageIndex];
    if (!stageData || !stageData.stages || !stageData.stages[0]) {
      throw new Error(`Stage ${stageIndex} not found`);
    }

    // stages[0] は string[] の配列なので、それを文字の2次元配列に変換
    this.stage = stageData.stages[0].map((row) => row.split(""));

    // カメラコンテナ（スクロール用）
    this.camera = new Container();
    this.container.addChild(this.camera);

    // ステージ描画用Graphics
    this.stageGraphics = new Graphics();
    this.camera.addChild(this.stageGraphics);
    this.renderStage();

    // エンティティ描画用Graphics
    this.entitiesGraphics = new Graphics();
    this.camera.addChild(this.entitiesGraphics);

    // プレイヤー生成（ステージ内の '0' を探す）
    let playerX = 0;
    let playerY = 0;
    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        if (this.stage[y][x] === "0") {
          playerX = x * BLOCKSIZE;
          playerY = y * BLOCKSIZE;
        }
      }
    }

    // プレイヤーもentitiesリストに追加
    this.player = new Player(playerX, playerY, this.stage, input);
    this.entities.push(this.player);
    this.add(this.player);

    // デモ用: 風エンティティを追加
    const wind = new Wind(playerX + 100, playerY - 50, 2, this.stage);
    this.entities.push(wind);
    this.add(wind);

    // デバッグテキスト（開発時のみ表示）
    if (DEBUG) {
      this.debugText = new Text({
        text: "",
        style: {
          fontFamily: FONT,
          fontSize: 10,
          fill: 0xffffff,
        },
        resolution: 1, // ピクセルフォント用に解像度を1に固定
      });
      this.debugText.x = 5;
      this.debugText.y = 5;
      this.debugText.roundPixels = true; // ピクセル境界に配置
      this.container.addChild(this.debugText);
    }
  }

  update() {
    super.update();

    // エンティティ間の衝突判定
    this.checkCollisions();

    // エンティティ描画更新
    this.renderEntities();

    // デバッグ情報更新（開発時のみ）
    if (DEBUG) {
      this.updateDebugInfo();
    }
  }

  /**
   * エンティティ間の衝突判定
   * CollisionReactionComponent を使った衝突処理
   */
  private checkCollisions() {
    // 全エンティティ同士の衝突チェック（N^2だが、エンティティ数が少ないので問題なし）
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityA = this.entities[i];
        const entityB = this.entities[j];

        // Rectangle.hitTest() を使用
        if (entityA.currentHitbox.hitTest(entityB.currentHitbox)) {
          // CollisionReactionComponent による双方向の反応処理
          entityA.handleCollision(entityB);
          entityB.handleCollision(entityA);
        }
      }
    }
  }

  /**
   * デバッグ情報更新
   */
  private updateDebugInfo() {
    const debug = this.player.getDebugInfo();
    const pressedKeys = this.input.getPressedKeys();
    const keyW = this.input.getKey('KeyW');
    const keyA = this.input.getKey('KeyA');
    const keyD = this.input.getKey('KeyD');

    this.debugText.text = [
      `x: ${debug.x}  y: ${debug.y}`,
      `vx: ${debug.vx}  vy: ${debug.vy}`,
      `coyoteTime: ${debug.coyoteTime}/${debug.coyoteTimeMax}`,
      `onGround: ${debug.onGround}`,
      `KeyW:${keyW} KeyA:${keyA} KeyD:${keyD}`,
      `Keys: ${pressedKeys.join(', ') || 'none'}`,
    ].join("\n");
  }

  /**
   * ステージ（タイルマップ）描画
   */
  private renderStage() {
    this.stageGraphics.clear();

    for (let y = 0; y < this.stage.length; y++) {
      for (let x = 0; x < this.stage[y].length; x++) {
        const block = this.stage[y][x];
        if (block === " " || block === "0") continue;

        // デバッグ用: 壁を白で描画
        this.stageGraphics.rect(
          x * BLOCKSIZE,
          y * BLOCKSIZE,
          BLOCKSIZE,
          BLOCKSIZE
        );
        this.stageGraphics.fill(0xffffff);
      }
    }
  }

  /**
   * 全エンティティ描画（プレイヤー含む）
   */
  private renderEntities() {
    this.entitiesGraphics.clear();

    this.entities.forEach((entity) => {
      // エンティティの種類に応じて色を変える
      let color = 0xaaaaaa; // デフォルト: グレー
      if (entity.imageKey === 'player') {
        color = 0xff0000; // プレイヤー: 赤
      } else if (entity.imageKey === 'wind') {
        color = 0x00ffff; // 風: シアン
      }

      // エンティティ本体
      this.entitiesGraphics.rect(
        entity.x,
        entity.y,
        entity.width,
        entity.height
      );
      this.entitiesGraphics.fill(color);

      // ヒットボックス表示（デバッグ用）
      if (DEBUG) {
        const hitbox = entity.currentHitbox;
        this.entitiesGraphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

        // プレイヤーは緑、その他は黄色
        const strokeColor = entity.imageKey === 'player' ? 0x00ff00 : 0xffff00;
        this.entitiesGraphics.stroke({ width: 1, color: strokeColor });
      }
    });
  }
}
