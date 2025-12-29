import { describe, it, expect } from 'vitest'

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with DOM', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello, World!'
    expect(div.textContent).toBe('Hello, World!')
  })
})
