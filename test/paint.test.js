import { describe, expect, it } from 'vitest'
import {
  createLinearGradientPaint,
  createSolidPaint,
  isGradientPaint,
  normalizeHexColor,
  normalizePaint,
  paintToCssBackground,
  paintToSignature,
} from '../src/paint'

describe('paint helpers', () => {
  it('规范化命名色、hex 与 rgb 颜色', () => {
    expect(normalizeHexColor('white')).toBe('#ffffff')
    expect(normalizeHexColor('RebeccaPurple')).toBe('#663399')
    expect(normalizeHexColor('#fff')).toBe('#ffffff')
    expect(normalizeHexColor('rgb(255, 0, 0)')).toBe('#ff0000')
    expect(normalizeHexColor('not-a-color', '#123456')).toBe('#123456')
  })

  it('transparent 会转成透明黑色 solid paint', () => {
    expect(createSolidPaint('transparent')).toEqual({
      kind: 'solid',
      color: '#000000',
      opacity: 0,
    })
  })

  it('保留线性渐变结构并可在禁用渐变时回退为纯色', () => {
    const gradient = createLinearGradientPaint({
      angle: 45,
      start: { color: '#ffffff', opacity: 1 },
      end: { color: '#2a75ef', opacity: 0.5 },
    })

    expect(isGradientPaint(gradient)).toBe(true)
    expect(normalizePaint(gradient, { allowGradient: false })).toEqual({
      kind: 'solid',
      color: '#2a75ef',
      opacity: 0.5,
    })
  })

  it('生成可比较签名与 css 背景', () => {
    const gradient = createLinearGradientPaint({
      angle: 90,
      start: { color: '#ffffff', opacity: 1 },
      end: { color: '#000000', opacity: 1 },
    })

    expect(paintToSignature(gradient)).toContain('linear-gradient')
    expect(paintToCssBackground(gradient)).toContain('linear-gradient')
    expect(paintToCssBackground('#ff0000')).toContain('rgba(255, 0, 0, 1)')
  })
})
