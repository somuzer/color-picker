# @somuzer/color-picker

仓库地址：[github.com/somuzer/color-picker](https://github.com/somuzer/color-picker)

独立的颜色选择器 Web Component，支持：

- 纯色
- 线性渐变
- 透明度
- 吸管取色（浏览器支持时）
- 自定义色板

组件基于 Vue Custom Element 实现，对外暴露标准自定义元素 `somuzer-color-picker`，可直接在 Vue、React、原生 HTML 项目中使用。

## 安装

```bash
npm install @somuzer/color-picker
```

## 使用

### ESM

```js
import { registerColorPicker } from '@somuzer/color-picker'

registerColorPicker()
```

```html
<somuzer-color-picker title="颜色"></somuzer-color-picker>
```

### 浏览器直引

```html
<script src="./dist/index.iife.js"></script>
<somuzer-color-picker></somuzer-color-picker>
```

IIFE 版本会自动注册 `somuzer-color-picker`。

### 完整示例

下面这段示例覆盖 3 个常见动作：

- 初始化颜色选择器配置
- 从业务侧传入当前作品颜色
- 用户点击色板或拖动面板后读取输出结果

```html
<div class="demo">
  <div class="demo-toolbar">
    <button id="apply-solid" type="button">设置作品为纯色</button>
    <button id="apply-gradient" type="button">设置作品为渐变</button>
  </div>

  <somuzer-color-picker
    id="picker"
    title="作品颜色"
    allow-gradient
  ></somuzer-color-picker>

  <div class="demo-result">
    <div>
      <strong>当前背景</strong>
      <div id="result-preview"></div>
    </div>
    <div>
      <strong>color-change 输出</strong>
      <pre id="result-json"></pre>
    </div>
  </div>
</div>

<script type="module">
  import { registerColorPicker } from '@somuzer/color-picker'

  registerColorPicker()

  const picker = document.getElementById('picker')
  const resultPreview = document.getElementById('result-preview')
  const resultJson = document.getElementById('result-json')
  const applySolidButton = document.getElementById('apply-solid')
  const applyGradientButton = document.getElementById('apply-gradient')

  function renderResult(detail) {
    resultPreview.style.background = detail.cssBackground
    resultJson.textContent = JSON.stringify(
      {
        value: detail.value,
        paint: detail.paint,
        cssBackground: detail.cssBackground,
      },
      null,
      2
    )
  }

  function setArtworkSolidColor() {
    // 纯色可直接传字符串
    picker.value = '#2a75ef'
  }

  function setArtworkGradientColor() {
    // 渐变请通过 JS property 传对象
    picker.value = {
      kind: 'linear-gradient',
      angle: 24,
      start: { color: '#fff2bf', opacity: 1 },
      end: { color: '#ff7a59', opacity: 1 },
    }
  }

  picker.swatches = [
    '#111827',
    '#2a75ef',
    '#f97316',
    {
      kind: 'linear-gradient',
      angle: 90,
      start: { color: '#22c55e', opacity: 1 },
      end: { color: '#14b8a6', opacity: 1 },
    },
  ]

  picker.addEventListener('color-change', (event) => {
    renderResult(event.detail)
  })

  applySolidButton.addEventListener('click', setArtworkSolidColor)
  applyGradientButton.addEventListener('click', setArtworkGradientColor)

  // 初始化作品颜色
  setArtworkGradientColor()

  // 如果希望首屏就有结果展示，可以主动同步一次
  renderResult({
    value: picker.value,
    paint: picker.value,
    cssBackground:
      'linear-gradient(114deg, rgba(255, 242, 191, 1), rgba(255, 122, 89, 1))',
  })
</script>
```

示例说明：

- `picker.value = '#2a75ef'` 适合传纯色作品颜色
- `picker.value = { kind: 'linear-gradient', ... }` 适合传渐变作品颜色
- `picker.swatches` 可以传推荐色、历史色，支持纯色和渐变混合
- `color-change` 会在点击色板、拖动取色面板、修改透明度或渐变角度后触发
- `event.detail.cssBackground` 可直接用于页面背景、按钮背景或作品预览

注意：

- HTML `value` attribute 只建议传纯色字符串
- 渐变对象必须通过 JS property 赋值，不能直接写进 HTML attribute

## JS 属性

- `value`: `string | Paint`
- `swatches`: `(string | Paint)[]`
- `title`: `string`
- `showOpacity`: `boolean`
- `showTitle`: `boolean`
- `allowGradient`: `boolean`

说明：

- HTML `value` attribute 只建议传纯色字符串。
- 渐变对象请通过 JS property 传入：`element.value = { kind: 'linear-gradient', ... }`

## 事件

### `color-change`

每次颜色变更时触发，`event.detail` 结构：

```js
{
  value: '#2a75ef' // 或规范化后的 paint 对象
  paint: { kind: 'solid', color: '#2a75ef', opacity: 1 },
  cssBackground: 'linear-gradient(...)'
}
```

### `close`

点击面板右上角关闭按钮时触发。

## Paint 数据结构

```js
const solid = '#2a75ef'

const gradient = {
  kind: 'linear-gradient',
  angle: 45,
  start: { color: '#ffffff', opacity: 1 },
  end: { color: '#2a75ef', opacity: 1 },
}
```

## 样式变量

- `--yd-picker-panel`
- `--yd-picker-border`
- `--yd-picker-text`
- `--yd-picker-muted`
- `--yd-picker-shadow`

## 本地开发

```bash
npm install
npm test
npm run build
```
