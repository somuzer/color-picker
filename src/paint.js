import { clamp01 } from './colorMath'

const DEFAULT_SOLID_COLOR = '#ffffff'

const NAMED_CSS_COLORS = Object.freeze({
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
})

function clamp(value, min, max, fallback = min) {
  if (value == null || value === '') return fallback
  const next = Number(value)
  if (!Number.isFinite(next)) return fallback
  return Math.min(max, Math.max(min, next))
}

function normalizeAngleValue(angle) {
  const next = Number(angle)
  if (!Number.isFinite(next)) return 0
  const normalized = next % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function parseHexColor(raw) {
  const compact = raw.trim().replace(/^#/, '')
  if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{4}$|^[\da-fA-F]{6}$|^[\da-fA-F]{8}$/.test(compact)) return null

  const normalized = compact.length <= 4
    ? compact.split('').map((char) => char + char).join('')
    : compact

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
    a: normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1,
  }
}

function parseRgbColor(raw) {
  const match = raw.trim().match(/^rgba?\((.+)\)$/i)
  if (!match) return null

  const parts = match[1].split(',').map((part) => part.trim())
  if (parts.length < 3 || parts.length > 4) return null

  const parseChannel = (value) => {
    if (value.endsWith('%')) return clamp(Number.parseFloat(value) * 2.55, 0, 255, 0)
    return clamp(Number.parseFloat(value), 0, 255, 0)
  }

  const parseAlpha = (value) => {
    if (value == null) return 1
    if (String(value).endsWith('%')) return clamp(Number.parseFloat(value) / 100, 0, 1, 1)
    return clamp(Number.parseFloat(value), 0, 1, 1)
  }

  return {
    r: parseChannel(parts[0]),
    g: parseChannel(parts[1]),
    b: parseChannel(parts[2]),
    a: parseAlpha(parts[3]),
  }
}

function parseCssColor(value) {
  if (typeof value !== 'string') return null

  const raw = value.trim().toLowerCase()
  if (!raw) return null
  if (raw === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  if (NAMED_CSS_COLORS[raw]) {
    return parseHexColor(NAMED_CSS_COLORS[raw])
  }

  return parseHexColor(raw) || parseRgbColor(raw)
}

function channelToHex(channel) {
  return Math.round(clamp(channel, 0, 255, 0)).toString(16).padStart(2, '0')
}

function rgbString(color, opacity = 1) {
  const parsed = parseCssColor(color) || parseCssColor('#000000')
  const alpha = clamp01(opacity, 1)
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${alpha})`
}

function isTransparentColor(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'transparent'
}

export function normalizeHexColor(value, fallback = DEFAULT_SOLID_COLOR) {
  const parsed = parseCssColor(value)
  if (!parsed) return fallback
  return `#${channelToHex(parsed.r)}${channelToHex(parsed.g)}${channelToHex(parsed.b)}`
}

export function createSolidPaint(color = DEFAULT_SOLID_COLOR, opacity = 1) {
  const parsed = parseCssColor(color)
  const transparent = isTransparentColor(color) || parsed?.a === 0
  return {
    kind: 'solid',
    color: normalizeHexColor(color, DEFAULT_SOLID_COLOR),
    opacity: transparent ? 0 : clamp01((parsed?.a ?? 1) * opacity, 1),
  }
}

export function createLinearGradientPaint({ angle = 0, start, end } = {}) {
  return {
    kind: 'linear-gradient',
    angle: normalizeAngleValue(angle),
    start: createSolidPaint(start?.color || '#ffffff', start?.opacity ?? 1),
    end: createSolidPaint(end?.color || '#000000', end?.opacity ?? 1),
  }
}

export function isPaintValue(value) {
  return !!value && typeof value === 'object' && typeof value.kind === 'string'
}

export function isSolidPaint(value) {
  return isPaintValue(value) && value.kind === 'solid'
}

export function isLinearGradientPaint(value) {
  return isPaintValue(value) && value.kind === 'linear-gradient'
}

export function isGradientPaint(value) {
  return isLinearGradientPaint(value)
}

export function normalizePaint(value, { allowGradient = true, fallbackColor = DEFAULT_SOLID_COLOR } = {}) {
  if (typeof value === 'string') {
    return createSolidPaint(value, 1)
  }

  if (isLinearGradientPaint(value)) {
    const normalized = createLinearGradientPaint({
      angle: value.angle,
      start: value.start,
      end: value.end,
    })
    return allowGradient ? normalized : createSolidPaint(normalized.end.color, normalized.end.opacity)
  }

  if (isSolidPaint(value)) {
    return createSolidPaint(value.color || fallbackColor, value.opacity ?? 1)
  }

  return createSolidPaint(fallbackColor, 1)
}

export function paintToSignature(paint) {
  const normalized = normalizePaint(paint, { allowGradient: true })
  if (isLinearGradientPaint(normalized)) {
    return [
      normalized.kind,
      Math.round(normalized.angle * 10) / 10,
      normalized.start.color,
      Math.round(normalized.start.opacity * 1000) / 1000,
      normalized.end.color,
      Math.round(normalized.end.opacity * 1000) / 1000,
    ].join('|')
  }

  return [normalized.kind, normalized.color, Math.round(normalized.opacity * 1000) / 1000].join('|')
}

export function paintToCssBackground(paint) {
  const normalized = normalizePaint(paint, { allowGradient: true })
  if (isLinearGradientPaint(normalized)) {
    return `linear-gradient(${normalized.angle + 90}deg, ${rgbString(normalized.start.color, normalized.start.opacity)}, ${rgbString(normalized.end.color, normalized.end.opacity)})`
  }
  return `linear-gradient(${rgbString(normalized.color, normalized.opacity)}, ${rgbString(normalized.color, normalized.opacity)})`
}

export function paintToPreviewStyle(paint) {
  return {
    background: paintToCssBackground(paint),
  }
}
