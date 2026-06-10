function cloneRgb(rgb) {
  return {
    r: rgb?.r ?? 255,
    g: rgb?.g ?? 0,
    b: rgb?.b ?? 0,
  }
}

export function clamp(value, min = 0, max = 1, fallback = min) {
  const next = Number(value)
  if (!Number.isFinite(next)) return fallback
  return Math.min(max, Math.max(min, next))
}

export function clamp01(value, fallback = 0) {
  return clamp(value, 0, 1, fallback)
}

export function normalizeHue(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return 0
  const normalized = next % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export function hexToRgb(hex, fallback = { r: 255, g: 0, b: 0 }) {
  if (typeof hex !== 'string') return cloneRgb(fallback)

  const compact = hex.trim().replace(/^#/, '')
  if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{6}$/.test(compact)) {
    return cloneRgb(fallback)
  }

  const normalized = compact.length === 3
    ? compact.split('').map((char) => char + char).join('')
    : compact

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

export function rgbToHex({ r = 255, g = 0, b = 0 } = {}) {
  const channelToHex = (channel) => {
    return Math.round(clamp(channel, 0, 255, 0)).toString(16).padStart(2, '0')
  }

  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

export function hsvToRgb({ h = 0, s = 1, v = 1 } = {}) {
  const hue = normalizeHue(h)
  const saturation = clamp01(s, 1)
  const value = clamp01(v, 1)
  const chroma = value * saturation
  const segment = hue / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))

  let red = 0
  let green = 0
  let blue = 0

  if (segment >= 0 && segment < 1) {
    red = chroma
    green = x
  } else if (segment < 2) {
    red = x
    green = chroma
  } else if (segment < 3) {
    green = chroma
    blue = x
  } else if (segment < 4) {
    green = x
    blue = chroma
  } else if (segment < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  const match = value - chroma

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  }
}

export function rgbToHsv({ r = 255, g = 0, b = 0 } = {}) {
  const red = clamp(r, 0, 255, 0) / 255
  const green = clamp(g, 0, 255, 0) / 255
  const blue = clamp(b, 0, 255, 0) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let hue = 0

  if (delta > 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
      hue = 60 * (((blue - red) / delta) + 2)
    } else {
      hue = 60 * (((red - green) / delta) + 4)
    }
  }

  return {
    h: normalizeHue(hue),
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

export function hexToHsva(hex, alpha = 1) {
  const rgb = hexToRgb(hex)
  const hsv = rgbToHsv(rgb)

  return {
    ...hsv,
    a: clamp01(alpha, 1),
  }
}

export function hsvaToHex({ h = 0, s = 1, v = 1 } = {}) {
  return rgbToHex(hsvToRgb({ h, s, v }))
}

export function hsvaToCss({ h = 0, s = 1, v = 1, a = 1 } = {}) {
  const { r, g, b } = hsvToRgb({ h, s, v })
  return `rgba(${r}, ${g}, ${b}, ${clamp01(a, 1)})`
}

export function getColorAreaPoint({ clientX = 0, clientY = 0, rect } = {}) {
  if (!rect?.width || !rect?.height) {
    return { s: 1, v: 1 }
  }

  return {
    s: clamp01((clientX - rect.left) / rect.width, 0),
    v: 1 - clamp01((clientY - rect.top) / rect.height, 1),
  }
}

export function getSliderPercent({ clientX = 0, rect } = {}) {
  if (!rect?.width) return 0
  return clamp01((clientX - rect.left) / rect.width, 0)
}

export function percentToHue(percent) {
  const normalizedPercent = clamp01(percent, 0)
  if (normalizedPercent >= 1) {
    return 360 - 1e-6
  }
  return normalizedPercent * 360
}

export function hueToPercent(hue) {
  return normalizeHue(hue) / 360
}
