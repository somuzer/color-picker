import { describe, expect, it } from 'vitest'
import {
  getDialAngleFromGradientAngle,
  getDialAngleFromPoint,
  getGradientAngleFromPoint,
  normalizeDialAngle,
} from '../src/angleDial'
import {
  hexToHsva,
  hsvaToHex,
  hueToPercent,
  percentToHue,
  rgbToHex,
} from '../src/colorMath'

describe('colorMath helpers', () => {
  it('在 hsva 与 hex 之间转换', () => {
    expect(hsvaToHex(hexToHsva('#2a75ef', 0.4))).toBe('#2a75ef')
    expect(rgbToHex({ r: 42, g: 117, b: 239 })).toBe('#2a75ef')
  })

  it('在色相和百分比之间转换', () => {
    expect(hueToPercent(180)).toBe(0.5)
    expect(percentToHue(0.5)).toBe(180)
  })
})

describe('angleDial helpers', () => {
  const rect = {
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  }

  it('规范化角度到 0-359', () => {
    expect(normalizeDialAngle(0)).toBe(0)
    expect(normalizeDialAngle(360)).toBe(0)
    expect(normalizeDialAngle(-90)).toBe(270)
    expect(normalizeDialAngle(725)).toBe(5)
  })

  it('按四个象限解析拨盘角度', () => {
    expect(getDialAngleFromPoint({ clientX: 100, clientY: 50, rect })).toBe(0)
    expect(getDialAngleFromPoint({ clientX: 50, clientY: 0, rect })).toBe(90)
    expect(getDialAngleFromPoint({ clientX: 0, clientY: 50, rect })).toBe(180)
    expect(getDialAngleFromPoint({ clientX: 50, clientY: 100, rect })).toBe(270)
  })

  it('将拨盘方向映射为渐变角度', () => {
    expect(getGradientAngleFromPoint({ clientX: 100, clientY: 50, rect })).toBe(0)
    expect(getGradientAngleFromPoint({ clientX: 50, clientY: 0, rect })).toBe(90)
    expect(getGradientAngleFromPoint({ clientX: 0, clientY: 50, rect })).toBe(180)
    expect(getGradientAngleFromPoint({ clientX: 50, clientY: 100, rect })).toBe(270)
    expect(getDialAngleFromGradientAngle(275)).toBe(275)
  })
})
