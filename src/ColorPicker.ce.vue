<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  createLinearGradientPaint,
  createSolidPaint,
  isGradientPaint,
  isLinearGradientPaint,
  normalizeHexColor,
  normalizePaint,
  paintToCssBackground,
  paintToPreviewStyle,
  paintToSignature,
} from './paint'
import {
  clamp01,
  getColorAreaPoint,
  getSliderPercent,
  hexToHsva,
  hsvaToCss,
  hsvaToHex,
  hsvToRgb,
  hueToPercent,
  normalizeHue,
  percentToHue,
} from './colorMath'
import { getDialAngleFromGradientAngle, getGradientAngleFromPoint } from './angleDial'

const props = defineProps({
  value: { type: [String, Object], default: '#ff0000' },
  showOpacity: { type: Boolean, default: true },
  showTitle: { type: Boolean, default: true },
  title: { type: String, default: '颜色' },
  swatches: { type: Array, default: () => [] },
  allowGradient: { type: Boolean, default: false },
})

const instance = getCurrentInstance()
const hasEyeDropper = typeof window !== 'undefined' && !!window.EyeDropper
const areaRef = ref(null)
const hueRef = ref(null)
const alphaRef = ref(null)
const angleFieldRef = ref(null)
const activeTab = ref('solid')
const activeStop = ref('start')
const currentPaint = ref(createSolidPaint('#ff0000'))
const lastGradientPaint = ref(createLinearGradientPaint())
const colorState = ref(hexToHsva('#ff0000', 1))
const hexInput = ref('#ff0000')
const opacityInput = ref('100')
const angleInput = ref('0')
const dragOffset = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const angleDialOpen = ref(false)
const angleDialRef = ref(null)

const SLIDER_THUMB_RADIUS = 6
const ANGLE_DIAL_SIZE = 40
const ANGLE_DIAL_RADIUS = 16

function getHostElement() {
  return instance?.ce
    || instance?.vnode?.ce
    || instance?.proxy?.$host
    || instance?.vnode?.el?.getRootNode?.()?.host
    || null
}

function dispatchHostEvent(name, detail = {}) {
  const host = getHostElement()
  if (!host) return
  host.dispatchEvent(new CustomEvent(name, {
    detail,
    bubbles: true,
    composed: true,
  }))
}

function getSliderThumbLeft(percent) {
  const safePercent = clamp01(percent, 0) * 100
  return `clamp(${SLIDER_THUMB_RADIUS}px, ${safePercent}%, calc(100% - ${SLIDER_THUMB_RADIUS}px))`
}

const isPaintMode = computed(() => props.allowGradient || (props.value && typeof props.value === 'object'))
const isEditingGradient = computed(() => props.allowGradient && activeTab.value === 'gradient' && isGradientPaint(currentPaint.value))
const editableStop = computed(() => {
  return isEditingGradient.value ? currentPaint.value[activeStop.value] : currentPaint.value
})
const gradientPreview = computed(() => {
  return isGradientPaint(currentPaint.value) ? paintToCssBackground(currentPaint.value) : 'transparent'
})
const displaySwatches = computed(() => {
  return (Array.isArray(props.swatches) ? props.swatches : [])
    .map((swatch) => normalizePaint(swatch, { allowGradient: true }))
    .filter((swatch) => props.allowGradient || !isGradientPaint(swatch))
})
const opaqueColorCss = computed(() => hsvaToCss({ ...colorState.value, a: 1 }))
const areaBaseStyle = computed(() => ({
  background: hsvaToCss({
    h: colorState.value.h,
    s: 1,
    v: 1,
    a: 1,
  }),
}))
const areaThumbStyle = computed(() => ({
  left: `${clamp01(colorState.value.s, 1) * 100}%`,
  top: `${(1 - clamp01(colorState.value.v, 1)) * 100}%`,
  background: opaqueColorCss.value,
}))
const hueThumbStyle = computed(() => ({
  left: getSliderThumbLeft(hueToPercent(colorState.value.h)),
}))
const alphaTrackStyle = computed(() => {
  const { r, g, b } = hsvToRgb(colorState.value)
  return {
    backgroundImage: `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`,
  }
})
const alphaThumbStyle = computed(() => ({
  left: getSliderThumbLeft(colorState.value.a),
}))
const angleDialRotation = computed(() => {
  if (!isLinearGradientPaint(currentPaint.value)) return 180
  return getDialAngleFromGradientAngle(currentPaint.value.angle)
})
const angleDialLineStyle = computed(() => ({
  width: `${ANGLE_DIAL_RADIUS}px`,
  transform: `translateY(-50%) rotate(${-angleDialRotation.value}deg)`,
}))
const angleDialHandleStyle = computed(() => {
  const radians = (angleDialRotation.value * Math.PI) / 180
  const center = ANGLE_DIAL_SIZE / 2
  return {
    left: `${center + Math.cos(radians) * ANGLE_DIAL_RADIUS}px`,
    top: `${center - Math.sin(radians) * ANGLE_DIAL_RADIUS}px`,
  }
})
const angleDialPopoverStyle = computed(() => {
  if (!angleFieldRef.value) return { right: '0px', top: '34px' }
  const width = angleFieldRef.value.getBoundingClientRect?.().width || 60
  return {
    left: `${width + 10}px`,
    top: '0px',
  }
})

function syncInputsFromColorState() {
  hexInput.value = hsvaToHex(colorState.value)
  opacityInput.value = String(Math.round(clamp01(colorState.value.a, 1) * 100))
}

function syncAngleInput() {
  angleInput.value = String(isLinearGradientPaint(currentPaint.value) ? Math.round(currentPaint.value.angle) : 0)
}

function toEditableLinearGradient(paint) {
  const normalized = normalizePaint(paint, { allowGradient: true })
  if (isLinearGradientPaint(normalized)) return normalized
  return createLinearGradientPaint({
    angle: 0,
    start: { color: '#ffffff', opacity: normalized.opacity },
    end: { color: normalized.color, opacity: normalized.opacity },
  })
}

function syncColorStateFromPaint() {
  const stop = editableStop.value ?? createSolidPaint('#ff0000')
  colorState.value = hexToHsva(stop.color, stop.opacity ?? 1)
  syncInputsFromColorState()
  syncAngleInput()
}

function syncFromProps() {
  const normalized = normalizePaint(props.value, { allowGradient: props.allowGradient })
  currentPaint.value = normalized
  if (isGradientPaint(normalized)) {
    lastGradientPaint.value = normalized
    activeTab.value = 'gradient'
  } else {
    activeTab.value = 'solid'
  }
  syncColorStateFromPaint()
}

watch(() => props.value, syncFromProps, { deep: true, immediate: true })
watch(() => props.allowGradient, syncFromProps)
watch(isEditingGradient, (value) => {
  if (!value) {
    angleDialOpen.value = false
  }
})

function emitPaint() {
  const normalized = normalizePaint(currentPaint.value, { allowGradient: props.allowGradient })
  currentPaint.value = normalized
  if (isGradientPaint(normalized)) {
    lastGradientPaint.value = normalized
  }
  dispatchHostEvent('color-change', {
    value: isPaintMode.value ? normalized : normalized.color,
    paint: normalized,
    cssBackground: paintToCssBackground(normalized),
  })
}

function updateGradientAngle(angle) {
  if (!isGradientPaint(currentPaint.value)) return
  currentPaint.value = {
    ...toEditableLinearGradient(currentPaint.value),
    angle,
  }
  syncAngleInput()
  emitPaint()
}

function updateAngleFromDialPointer(event) {
  const rect = angleDialRef.value?.getBoundingClientRect?.()
  if (!rect) return
  const fallbackAngle = isLinearGradientPaint(currentPaint.value) ? currentPaint.value.angle : 0
  updateGradientAngle(Math.round(getGradientAngleFromPoint({
    clientX: event.clientX,
    clientY: event.clientY,
    rect,
    fallbackAngle,
  })))
}

function startAngleDialDrag(event) {
  if (!isLinearGradientPaint(currentPaint.value)) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  event.preventDefault()
  angleDialOpen.value = true
  updateAngleFromDialPointer(event)

  const move = (nextEvent) => updateAngleFromDialPointer(nextEvent)
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

function updateEditableStop({ color, opacity, syncState = true } = {}) {
  if (isEditingGradient.value) {
    const editableGradient = toEditableLinearGradient(currentPaint.value)
    currentPaint.value = {
      ...editableGradient,
      [activeStop.value]: {
        ...editableGradient[activeStop.value],
        ...(color ? { color } : {}),
        ...(typeof opacity === 'number' ? { opacity } : {}),
      },
    }
  } else {
    currentPaint.value = createSolidPaint(
      color || currentPaint.value.color,
      typeof opacity === 'number' ? opacity : currentPaint.value.opacity,
    )
  }

  if (syncState) {
    syncColorStateFromPaint()
  } else {
    syncAngleInput()
  }

  emitPaint()
}

function commitColorState(nextState) {
  const base = colorState.value
  colorState.value = {
    h: normalizeHue(nextState.h ?? base.h),
    s: clamp01(nextState.s ?? base.s, base.s),
    v: clamp01(nextState.v ?? base.v, base.v),
    a: clamp01(nextState.a ?? base.a, base.a),
  }
  syncInputsFromColorState()
  updateEditableStop({
    color: hsvaToHex(colorState.value),
    opacity: colorState.value.a,
    syncState: false,
  })
}

function startPointerDrag(event, onMove) {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  event.preventDefault()
  onMove(event)

  const move = (nextEvent) => onMove(nextEvent)
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

function startPanelDrag(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (event.target.closest('.picker-icon-button')) return

  event.preventDefault()
  isDragging.value = true
  const startX = event.clientX - dragOffset.x
  const startY = event.clientY - dragOffset.y

  const move = (nextEvent) => {
    dragOffset.x = nextEvent.clientX - startX
    dragOffset.y = nextEvent.clientY - startY
  }
  const stop = () => {
    isDragging.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

function updateAreaFromPointer(event) {
  const rect = areaRef.value?.getBoundingClientRect()
  if (!rect) return

  const next = getColorAreaPoint({
    clientX: event.clientX,
    clientY: event.clientY,
    rect,
  })

  commitColorState({
    ...colorState.value,
    s: next.s,
    v: next.v,
  })
}

function updateHueFromPointer(event) {
  const rect = hueRef.value?.getBoundingClientRect()
  if (!rect) return

  commitColorState({
    ...colorState.value,
    h: percentToHue(getSliderPercent({ clientX: event.clientX, rect })),
  })
}

function updateAlphaFromPointer(event) {
  if (!props.showOpacity) return
  const rect = alphaRef.value?.getBoundingClientRect()
  if (!rect) return

  commitColorState({
    ...colorState.value,
    a: getSliderPercent({ clientX: event.clientX, rect }),
  })
}

function readInputValue(valueOrEvent) {
  if (valueOrEvent && typeof valueOrEvent === 'object' && 'target' in valueOrEvent) {
    return String(valueOrEvent.target?.value ?? '')
  }
  return String(valueOrEvent ?? '')
}

function onHexInput(valueOrEvent) {
  hexInput.value = readInputValue(valueOrEvent).trim()
}

function commitHexInput() {
  const raw = hexInput.value.trim()
  if (!raw) {
    syncInputsFromColorState()
    return
  }

  let value = raw
  if (!value.startsWith('#')) value = `#${value}`
  if (!/^#([\da-fA-F]{3}|[\da-fA-F]{6})$/.test(value)) {
    syncInputsFromColorState()
    return
  }

  const next = normalizeHexColor(value, null)
  if (!next) {
    syncInputsFromColorState()
    return
  }

  commitColorState(hexToHsva(next, colorState.value.a))
}

function onOpacityInput(valueOrEvent) {
  const raw = readInputValue(valueOrEvent).trim()
  opacityInput.value = raw
  if (raw === '') return

  const next = Number.parseInt(raw, 10)
  if (!Number.isFinite(next)) return

  commitColorState({
    ...colorState.value,
    a: clamp01(next / 100, colorState.value.a),
  })
}

function onAngleInput(valueOrEvent) {
  if (!isGradientPaint(currentPaint.value)) return

  const raw = readInputValue(valueOrEvent).trim()
  angleInput.value = raw
  if (raw === '') return

  const next = Number.parseFloat(raw)
  if (!Number.isFinite(next)) return

  currentPaint.value = {
    ...toEditableLinearGradient(currentPaint.value),
    angle: next,
  }
  emitPaint()
}

function switchTab(tab) {
  if (tab === activeTab.value || (tab === 'gradient' && !props.allowGradient)) return

  if (tab === 'gradient') {
    const solid = normalizePaint(currentPaint.value, { allowGradient: false })
    currentPaint.value = isGradientPaint(lastGradientPaint.value)
      ? toEditableLinearGradient(lastGradientPaint.value)
      : createLinearGradientPaint({
          angle: 0,
          start: { color: '#ffffff', opacity: solid.opacity },
          end: { color: solid.color, opacity: solid.opacity },
        })
    activeStop.value = 'start'
  } else if (isGradientPaint(currentPaint.value)) {
    lastGradientPaint.value = currentPaint.value
    currentPaint.value = createSolidPaint(
      currentPaint.value[activeStop.value].color,
      currentPaint.value[activeStop.value].opacity,
    )
  } else {
    currentPaint.value = normalizePaint(currentPaint.value, { allowGradient: false })
  }

  activeTab.value = tab
  syncColorStateFromPaint()
  emitPaint()
}

function setActiveStop(stop) {
  activeStop.value = stop
  syncColorStateFromPaint()
}

function pickSwatch(swatch) {
  const normalized = normalizePaint(swatch, { allowGradient: props.allowGradient })
  currentPaint.value = normalized
  if (isGradientPaint(normalized)) {
    lastGradientPaint.value = normalized
    activeTab.value = 'gradient'
    activeStop.value = 'start'
  } else {
    activeTab.value = 'solid'
  }
  syncColorStateFromPaint()
  emitPaint()
}

function isSwatchActive(swatch) {
  return paintToSignature(swatch) === paintToSignature(currentPaint.value)
}

async function useEyeDropper() {
  if (!window.EyeDropper) return

  try {
    const dropper = new window.EyeDropper()
    const result = await dropper.open()
    if (!result?.sRGBHex) return

    const next = normalizeHexColor(result.sRGBHex, editableStop.value?.color ?? '#ff0000')
    if (!next) return

    commitColorState(hexToHsva(next, colorState.value.a))
  } catch {
    // User cancelled or browser rejected.
  }
}

function onDocumentPointerDown(event) {
  if (!angleDialOpen.value) return
  const path = event.composedPath?.() || []
  if (path.includes(angleFieldRef.value) || path.includes(angleDialRef.value)) return
  angleDialOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <div
    class="color-picker-panel select-none"
    :style="{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }"
  >
    <div
      v-if="showTitle"
      class="picker-header"
      :class="{ 'is-dragging': isDragging }"
      @pointerdown="startPanelDrag"
    >
      <h3 class="picker-title">{{ title }}</h3>
      <button
        type="button"
        class="picker-icon-button"
        aria-label="关闭颜色面板"
        @click="dragOffset.x = 0; dragOffset.y = 0; dispatchHostEvent('close')"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4L12 12M12 4L4 12" />
        </svg>
      </button>
    </div>

    <div class="color-picker-body">
      <div v-if="allowGradient" class="picker-tabs">
        <button
          type="button"
          class="picker-tab"
          :class="{ 'is-active': activeTab === 'solid' }"
          :aria-pressed="activeTab === 'solid'"
          @click="switchTab('solid')"
        >
          纯色
        </button>
        <button
          type="button"
          class="picker-tab"
          :class="{ 'is-active': activeTab === 'gradient' }"
          :aria-pressed="activeTab === 'gradient'"
          @click="switchTab('gradient')"
        >
          渐变
        </button>
      </div>

      <div v-if="isEditingGradient" class="picker-gradient">
        <div class="picker-gradient__rail">
          <div class="picker-gradient__preview" :style="{ background: gradientPreview }" />
          <button
            type="button"
            class="picker-stop"
            :class="{ 'is-active': activeStop === 'start' }"
            aria-label="编辑渐变起点"
            @click="setActiveStop('start')"
          >
            <span class="picker-stop__preview" :style="paintToPreviewStyle(currentPaint.start)" />
          </button>
          <button
            type="button"
            class="picker-stop picker-stop--end"
            :class="{ 'is-active': activeStop === 'end' }"
            aria-label="编辑渐变终点"
            @click="setActiveStop('end')"
          >
            <span class="picker-stop__preview" :style="paintToPreviewStyle(currentPaint.end)" />
          </button>
        </div>

        <div ref="angleFieldRef" class="picker-angle-field-wrap">
          <label v-if="isLinearGradientPaint(currentPaint)" class="picker-field picker-field--angle">
            <span class="picker-field__suffix">°</span>
            <input
              class="picker-input picker-input--number"
              type="number"
              :value="angleInput"
              aria-label="渐变角度"
              @focus="angleDialOpen = true"
              @input="onAngleInput"
              @blur="syncAngleInput"
            />
          </label>

          <div
            v-if="angleDialOpen && isLinearGradientPaint(currentPaint)"
            class="picker-angle-dial-popover"
            :style="angleDialPopoverStyle"
          >
            <div class="picker-angle-dial" aria-label="渐变角度手柄设置盘" @pointerdown="startAngleDialDrag">
              <div ref="angleDialRef" class="picker-angle-dial__surface">
                <div class="picker-angle-dial__disc" />
                <div class="picker-angle-dial__line" :style="angleDialLineStyle" />
                <div class="picker-angle-dial__handle" :style="angleDialHandleStyle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref="areaRef"
        class="picker-area"
        :style="areaBaseStyle"
        aria-label="饱和度和明度"
        @pointerdown="(event) => startPointerDrag(event, updateAreaFromPointer)"
      >
        <div class="picker-area__white" />
        <div class="picker-area__black" />
        <div class="picker-area__thumb" :style="areaThumbStyle" />
      </div>

      <div
        ref="hueRef"
        class="picker-slider"
        aria-label="色相"
        @pointerdown="(event) => startPointerDrag(event, updateHueFromPointer)"
      >
        <div class="picker-slider__track picker-slider__track--hue" />
        <div class="picker-slider__thumb" :style="hueThumbStyle" />
      </div>

      <div
        v-if="showOpacity"
        ref="alphaRef"
        class="picker-slider picker-slider--alpha"
        aria-label="透明度"
        @pointerdown="(event) => startPointerDrag(event, updateAlphaFromPointer)"
      >
        <div class="picker-slider__checker" />
        <div class="picker-slider__track picker-slider__track--alpha" :style="alphaTrackStyle" />
        <div class="picker-slider__thumb" :style="alphaThumbStyle" />
      </div>

      <div class="picker-inputs" :class="{ 'picker-inputs--compact': !showOpacity }">
        <button
          type="button"
          class="picker-eye-dropper"
          :class="{ 'is-disabled': !hasEyeDropper }"
          :disabled="!hasEyeDropper"
          aria-label="吸取屏幕颜色"
          @click="useEyeDropper"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10.8 2.3a1.5 1.5 0 0 1 2.1 2.1l-1 1 1 1a.75.75 0 1 1-1.06 1.06l-1-1-4.9 4.9a2 2 0 0 1-1 .55l-2.2.55.55-2.2a2 2 0 0 1 .55-1l4.9-4.9-1-1A.75.75 0 1 1 8.76 2.8l1 1 1.04-1.5Z" />
          </svg>
        </button>

        <label class="picker-field picker-field--hex">
          <input
            class="picker-input"
            type="text"
            autocapitalize="off"
            spellcheck="false"
            :value="hexInput"
            aria-label="十六进制颜色"
            @input="onHexInput"
            @keydown.enter.prevent="commitHexInput"
            @blur="syncInputsFromColorState"
          />
        </label>

        <label v-if="showOpacity" class="picker-field picker-field--opacity">
          <span class="picker-field__suffix">%</span>
          <input
            class="picker-input picker-input--number"
            type="number"
            min="0"
            max="100"
            inputmode="numeric"
            :value="opacityInput"
            aria-label="透明度百分比"
            @input="onOpacityInput"
            @blur="syncInputsFromColorState"
          />
        </label>
      </div>

      <div class="picker-swatches">
        <div class="picker-swatches__header">
          <span>当前作品</span>
        </div>

        <div v-if="displaySwatches.length" class="picker-swatches__grid">
          <button
            v-for="swatch in displaySwatches"
            :key="paintToSignature(swatch)"
            type="button"
            class="picker-swatch"
            :class="{ 'is-active': isSwatchActive(swatch) }"
            :aria-label="`使用颜色 ${paintToSignature(swatch)}`"
            @click="pickSwatch(swatch)"
          >
            <span class="picker-swatch__fill" :style="paintToPreviewStyle(swatch)" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:host {
  display: block;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

button,
input {
  font: inherit;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.select-none {
  user-select: none;
}

.color-picker-panel {
  --picker-panel: var(--yd-picker-panel, #ffffff);
  --picker-surface: #f1f2f4;
  --picker-surface-strong: #e7eaf0;
  --picker-border: var(--yd-picker-border, rgba(27, 34, 48, 0.12));
  --picker-border-strong: rgba(27, 34, 48, 0.18);
  --picker-text: var(--yd-picker-text, #1f2430);
  --picker-muted: var(--yd-picker-muted, #7c8597);
  --picker-shadow: var(--yd-picker-shadow, 0 24px 56px rgba(15, 21, 32, 0.16));
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(229, 232, 238, 0.92);
  background: var(--picker-panel);
  box-shadow: var(--picker-shadow);
  backdrop-filter: blur(18px);
  color: var(--picker-text);
}

.color-picker-body {
  display: flex;
  padding: 0 16px 16px;
  flex-direction: column;
  gap: 10px;
}

.picker-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
}

.picker-header.is-dragging {
  cursor: grabbing;
}

.picker-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.picker-icon-button,
.picker-tab,
.picker-stop,
.picker-eye-dropper,
.picker-swatch {
  cursor: pointer;
  border: 0;
  padding: 0;
  font: inherit;
}

.picker-icon-button {
  display: inline-flex;
  height: 18px;
  width: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--picker-muted);
  background: transparent;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.picker-icon-button:hover {
  color: var(--picker-text);
  background: rgba(27, 34, 48, 0.06);
}

.picker-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-radius: 10px;
  background: var(--picker-surface);
  padding: 2px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.picker-tab {
  height: 30px;
  border-radius: 6px;
  color: #616a7c;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 180ms ease, box-shadow 180ms ease, color 180ms ease;
}

.picker-tab.is-active {
  color: var(--picker-text);
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 8px 18px rgba(21, 28, 40, 0.06),
    inset 0 0 0 1px rgba(24, 31, 45, 0.08);
}

.picker-gradient {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px;
  align-items: center;
  gap: 15px;
}

.picker-gradient__rail {
  position: relative;
  flex: 1;
  height: 1px;
}

.picker-gradient__preview {
  position: absolute;
  top: 50%;
  left: 8px;
  right: 8px;
  height: 10px;
  transform: translateY(-50%);
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px rgba(16, 24, 40, 0.1),
    0 6px 14px rgba(15, 23, 42, 0.06);
}

.picker-stop {
  position: absolute;
  top: 50%;
  left: 0;
  display: inline-flex;
  height: 16px;
  width: 16px;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border-radius: 100%;
  background: #ffffff;
  padding: 2.5px;
  box-shadow: 0 0 2px #00000059;
}

.picker-stop--end {
  left: auto;
  right: 0;
}

.picker-stop.is-active {
  box-shadow: 0 0 0 1.5px #2254f4;
}

.picker-stop__preview {
  display: block;
  height: 100%;
  width: 100%;
  border-radius: 100%;
}

.picker-angle-field-wrap {
  position: relative;
}

.picker-area {
  position: relative;
  height: 140px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(20, 26, 37, 0.08),
    0 6px 20px rgba(20, 26, 37, 0.08);
  touch-action: none;
  cursor: pointer;
}

.picker-area__white,
.picker-area__black {
  position: absolute;
  inset: 0;
}

.picker-area__white {
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
}

.picker-area__black {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
}

.picker-area__thumb {
  position: absolute;
  height: 18px;
  width: 18px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 1);
  box-shadow:
    0 10px 18px rgba(12, 18, 28, 0.2),
    inset 0 0 0 1px rgba(9, 14, 20, 0.18);
  pointer-events: none;
}

.picker-slider {
  position: relative;
  height: 12px;
  touch-action: none;
}

.picker-slider__checker,
.picker-slider__track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
}

.picker-slider__track {
  cursor: pointer;
  overflow: hidden;
  border: 1px solid var(--picker-border);
}

.picker-slider__track--hue {
  background: linear-gradient(90deg, #ff2d55 0%, #ff9500 16%, #ffd60a 32%, #30d158 48%, #00c7be 64%, #0a84ff 80%, #bf5af2 90%, #ff2d55 100%);
}

.picker-slider__checker {
  border: 1px solid var(--picker-border);
  background-color: #eef0f3;
  background-image:
    linear-gradient(45deg, #d8dce2 25%, transparent 25%, transparent 75%, #d8dce2 75%, #d8dce2),
    linear-gradient(45deg, #d8dce2 25%, transparent 25%, transparent 75%, #d8dce2 75%, #d8dce2);
  background-position: 0 0, 6px 6px;
  background-size: 12px 12px;
}

.picker-slider__track--alpha {
  border-color: transparent;
}

.picker-slider__thumb {
  position: absolute;
  top: 50%;
  height: 12px;
  width: 12px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 1px solid #000000;
  background: #ffffff;
  box-shadow: 0 8px 14px rgba(14, 20, 30, 0.18);
  pointer-events: none;
}

.picker-inputs {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 60px;
  gap: 10px;
  align-items: center;
}

.picker-inputs--compact {
  grid-template-columns: 28px minmax(0, 1fr);
}

.picker-eye-dropper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 28px;
  border-radius: 8px;
  padding: 6px;
  background: var(--picker-surface);
  color: var(--picker-text);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.picker-eye-dropper:hover {
  background: var(--picker-surface-strong);
}

.picker-eye-dropper.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.picker-field {
  position: relative;
}

.picker-field__suffix {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #5d6678;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}

.picker-input {
  width: 100%;
  height: 28px;
  border: 1px solid var(--picker-border);
  border-radius: 8px;
  background: #ffffff;
  color: var(--picker-text);
  padding: 0 10px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.picker-input:focus {
  border-color: #2a75ef;
  box-shadow: 0 0 0 3px rgba(42, 117, 239, 0.14);
}

.picker-input--number {
  text-align: center;
  padding-right: 20px;
}

.picker-input::-webkit-outer-spin-button,
.picker-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.picker-input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.picker-angle-dial-popover {
  position: absolute;
  z-index: 10;
  width: auto;
}

.picker-angle-dial {
  border-radius: 12px;
  background: #ffffff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.14),
    0 6px 14px rgba(15, 23, 42, 0.08);
  padding: 5px;
  cursor: pointer;
  touch-action: none;
}

.picker-angle-dial__surface {
  position: relative;
  width: 40px;
  height: 40px;
}

.picker-angle-dial__disc {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 42%),
    #e8ebf5;
}

.picker-angle-dial__line {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 2px;
  border-radius: 999px;
  background: #58627c;
  transform-origin: 0 50%;
}

.picker-angle-dial__handle {
  position: absolute;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: #4c566f;
}

.picker-swatches {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picker-swatches__header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.picker-swatches__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.picker-swatch {
  position: relative;
  overflow: hidden;
  height: 24px;
  width: 24px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.picker-swatch.is-active {
  box-shadow: 0 0 0 2px rgba(42, 117, 239, 0.28);
}

.picker-swatch__fill {
  display: block;
  height: 100%;
  width: 100%;
}
</style>
