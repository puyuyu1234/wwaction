/**
 * AABB (Axis-Aligned Bounding Box) 矩形クラス
 */
export class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  /**
   * 他の矩形と重なっているか判定
   */
  hitTest(other: Rectangle): boolean {
    const horizontal = other.left < this.right && this.left < other.right
    const vertical = other.top < this.bottom && this.top < other.bottom
    return horizontal && vertical
  }

  /**
   * 指定した座標が矩形内にあるか判定
   */
  contain(x: number, y: number): boolean {
    return this.left <= x && x < this.right && this.top <= y && y < this.bottom
  }

  /**
   * 矩形を複製
   */
  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height)
  }

  // Getters
  get left(): number {
    return this.x
  }

  get right(): number {
    return this.x + this.width
  }

  get top(): number {
    return this.y
  }

  get bottom(): number {
    return this.y + this.height
  }

  get centerX(): number {
    return this.x + this.width / 2
  }

  get centerY(): number {
    return this.y + this.height / 2
  }

  get center(): [number, number] {
    return [this.centerX, this.centerY]
  }

  get param(): [number, number, number, number] {
    return [this.x, this.y, this.width, this.height]
  }
}
