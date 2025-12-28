/**
 * HP管理コンポーネント
 * - HP、最大HP、無敵時間を管理
 * - ダメージ、回復、無敵状態の判定
 * - 点滅エフェクト用の状態提供
 */
export class HealthComponent {
  private hp: number
  private maxHp: number
  private noHitboxTime = 0 // 無敵時間（フレーム数）
  private readonly INVINCIBLE_FRAMES = 50 // 無敵時間の長さ

  constructor(hp: number, maxHp: number) {
    this.hp = hp
    this.maxHp = maxHp
  }

  /**
   * ダメージを受ける
   * @param amount ダメージ量
   * @returns ダメージ結果（実際に受けたダメージ量、死亡したか）
   */
  damage(amount: number): { actualDamage: number; isDead: boolean } {
    // 無敵時間中はダメージを受けない
    if (this.noHitboxTime > 0) {
      return { actualDamage: 0, isDead: false }
    }

    // HPを減らす（最小0）
    const nextHp = Math.max(0, this.hp - amount)
    const actualDamage = this.hp - nextHp
    this.hp = nextHp

    // 無敵時間を設定
    this.noHitboxTime = this.INVINCIBLE_FRAMES

    return {
      actualDamage,
      isDead: this.hp <= 0,
    }
  }

  /**
   * 回復する
   * @param amount 回復量
   */
  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  /**
   * 毎フレーム更新
   * - 無敵時間のカウントダウン
   */
  update() {
    if (this.noHitboxTime > 0) {
      this.noHitboxTime--
    }
  }

  /**
   * 無敵状態かどうか
   */
  isInvincible(): boolean {
    return this.noHitboxTime > 0
  }

  /**
   * 点滅すべきタイミングかどうか
   * （無敵時間中、2フレームごとに点滅）
   */
  shouldBlink(): boolean {
    return this.noHitboxTime > 0 && this.noHitboxTime % 2 === 0
  }

  /**
   * 死亡しているかどうか
   */
  isDead(): boolean {
    return this.hp <= 0
  }

  /**
   * 現在のHPを取得
   */
  getHp(): number {
    return this.hp
  }

  /**
   * 最大HPを取得
   */
  getMaxHp(): number {
    return this.maxHp
  }
}
