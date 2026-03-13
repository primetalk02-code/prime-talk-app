import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins mixed class inputs', () => {
    const value = cn(
      'base',
      ['nested', ['again']],
      { enabled: true, disabled: false },
      null,
      undefined,
    )

    expect(value).toBe('base nested again enabled')
  })
})

