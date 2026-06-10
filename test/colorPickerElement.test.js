import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createLinearGradientPaint } from '../src/paint'
import { registerColorPicker } from '../src/index'

const TEST_TAG = 'somuzer-color-picker-test'

function waitForRender() {
  return nextTick()
}

function createPicker() {
  const element = document.createElement(TEST_TAG)
  document.body.appendChild(element)
  return element
}

beforeAll(() => {
  registerColorPicker(TEST_TAG)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('somuzer color picker custom element', () => {
  it('通过 value property 初始化线性渐变并渲染到 shadow root', async () => {
    const element = createPicker()
    element.allowGradient = true
    element.value = createLinearGradientPaint({
      angle: 90,
      start: { color: '#ffffff', opacity: 1 },
      end: { color: '#2a75ef', opacity: 1 },
    })

    await waitForRender()

    const angleInput = element.shadowRoot.querySelector('[aria-label="渐变角度"]')
    expect(element.shadowRoot).not.toBeNull()
    expect(element.shadowRoot.querySelector('style')).not.toBeNull()
    expect(angleInput).not.toBeNull()
    expect(angleInput.value).toBe('90')
  })

  it('交互后触发 color-change 且返回约定 detail', async () => {
    const element = createPicker()
    const events = []
    element.swatches = ['#111111', '#2a75ef']
    element.addEventListener('color-change', (event) => {
      events.push(event.detail)
    })

    await waitForRender()

    const swatches = element.shadowRoot.querySelectorAll('.picker-swatch')
    swatches[1].click()
    await waitForRender()

    expect(events).toHaveLength(1)
    expect(events[0].value).toBe('#2a75ef')
    expect(events[0].paint).toMatchObject({
      kind: 'solid',
      color: '#2a75ef',
      opacity: 1,
    })
    expect(events[0].cssBackground).toContain('rgba(42, 117, 239, 1)')
  })

  it('allowGradient=false 时不显示渐变 tab', async () => {
    const element = createPicker()
    element.allowGradient = false
    element.value = '#ff0000'

    await waitForRender()

    expect(element.shadowRoot.querySelector('.picker-tabs')).toBeNull()
  })

  it('点击关闭按钮时触发 close 事件', async () => {
    const element = createPicker()
    const onClose = { called: false }
    element.addEventListener('close', () => {
      onClose.called = true
    })

    await waitForRender()

    element.shadowRoot.querySelector('[aria-label="关闭颜色面板"]').click()
    expect(onClose.called).toBe(true)
  })

  it('支持渐变 swatches 回填', async () => {
    const element = createPicker()
    const changes = []
    element.allowGradient = true
    element.swatches = [
      createLinearGradientPaint({
        angle: 45,
        start: { color: '#ffffff', opacity: 1 },
        end: { color: '#111111', opacity: 1 },
      }),
    ]
    element.addEventListener('color-change', (event) => {
      changes.push(event.detail)
    })

    await waitForRender()

    element.shadowRoot.querySelector('.picker-swatch').click()
    await waitForRender()

    expect(changes[0].value).toMatchObject({ kind: 'linear-gradient', angle: 45 })
    expect(element.shadowRoot.querySelector('[aria-label="渐变角度"]').value).toBe('45')
  })
})
