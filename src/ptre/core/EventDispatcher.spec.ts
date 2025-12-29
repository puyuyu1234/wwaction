import { describe, it, expect, vi } from 'vitest'

import { EventDispatcher } from './EventDispatcher'

describe('EventDispatcher', () => {
  describe('on/dispatch', () => {
    it('calls registered listener', () => {
      const dispatcher = new EventDispatcher()
      const callback = vi.fn()

      dispatcher.on('test', callback)
      dispatcher.dispatch('test', 'arg1', 'arg2')

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('calls multiple listeners', () => {
      const dispatcher = new EventDispatcher()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      dispatcher.on('test', callback1)
      dispatcher.on('test', callback2)
      dispatcher.dispatch('test')

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('off', () => {
    it('removes listener', () => {
      const dispatcher = new EventDispatcher()
      const callback = vi.fn()

      dispatcher.on('test', callback)
      dispatcher.off('test', callback)
      dispatcher.dispatch('test')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('once', () => {
    it('calls listener only once', () => {
      const dispatcher = new EventDispatcher()
      const callback = vi.fn()

      dispatcher.once('test', callback)
      dispatcher.dispatch('test')
      dispatcher.dispatch('test')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearEvents', () => {
    it('removes all listeners for event', () => {
      const dispatcher = new EventDispatcher()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      dispatcher.on('test', callback1)
      dispatcher.on('test', callback2)
      dispatcher.clearEvents('test')
      dispatcher.dispatch('test')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('hasListeners', () => {
    it('returns true when listeners exist', () => {
      const dispatcher = new EventDispatcher()

      dispatcher.on('test', () => {})

      expect(dispatcher.hasListeners('test')).toBe(true)
    })

    it('returns false when no listeners', () => {
      const dispatcher = new EventDispatcher()

      expect(dispatcher.hasListeners('test')).toBe(false)
    })
  })
})
