import { Input } from '@core/Input'
import { describe, it, expect, vi } from 'vitest'

import { UISprite } from './UISprite'

describe('UISprite', () => {
  it('初期化時に初期アニメーションが再生される', () => {
    const input = new Input()

    // playAnimationをモック化してコンストラクタで呼ばれることを確認
    const playAnimationSpy = vi.spyOn(UISprite.prototype, 'playAnimation')

    new UISprite('w', 224, 112, input)

    expect(playAnimationSpy).toHaveBeenCalledWith('W')

    playAnimationSpy.mockRestore()
  })

  it('存在しないタイプの場合、エラーをスローする', () => {
    const input = new Input()
    expect(() => new UISprite('z', 0, 0, input)).toThrow('Unknown UI type: z')
  })

  it('キーが押されていない場合、通常アニメーションを表示する', () => {
    const input = new Input()
    const uiSprite = new UISprite('w', 224, 112, input)

    const playAnimationSpy = vi.spyOn(uiSprite, 'playAnimation')

    uiSprite.update()

    expect(playAnimationSpy).toHaveBeenCalledWith('W')
  })

  it('キーが押されている場合、押下アニメーションを表示する', () => {
    const input = new Input()
    const uiSprite = new UISprite('w', 224, 112, input)

    const playAnimationSpy = vi.spyOn(uiSprite, 'playAnimation')

    // Wキーを押す
    input['keyTimeMap'].set('w', 1)

    uiSprite.update()

    expect(playAnimationSpy).toHaveBeenCalledWith('W-pushed')
  })

  it('押下アニメーションが存在しない場合、アニメーション切り替えをしない', () => {
    const input = new Input()
    const uiSprite = new UISprite('+', 736, 96, input)

    const playAnimationSpy = vi.spyOn(uiSprite, 'playAnimation')

    // +キーを押す
    input['keyTimeMap'].set('+', 1)

    uiSprite.update()

    // pushedAnimationKeyが未定義なので切り替えは行われない
    expect(playAnimationSpy).not.toHaveBeenCalled()
  })
})
