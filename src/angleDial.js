const FULL_ROTATION = 360

export function normalizeDialAngle(angle) {
  const next = Number(angle)
  if (!Number.isFinite(next)) return 0
  const normalized = next % FULL_ROTATION
  const wrapped = normalized < 0 ? normalized + FULL_ROTATION : normalized
  return Object.is(wrapped, -0) ? 0 : wrapped
}

export function getDialAngleFromPoint({
  clientX,
  clientY,
  rect,
  fallbackAngle = 0,
  deadzone = 8,
} = {}) {
  if (!rect) return normalizeDialAngle(fallbackAngle)

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const dx = Number(clientX) - centerX
  const dy = Number(clientY) - centerY

  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return normalizeDialAngle(fallbackAngle)
  }

  if (Math.hypot(dx, dy) <= Math.max(0, Number(deadzone) || 0)) {
    return normalizeDialAngle(fallbackAngle)
  }

  return normalizeDialAngle((Math.atan2(-dy, dx) * 180) / Math.PI)
}

export function getGradientAngleFromPoint(options = {}) {
  return getDialAngleFromPoint({
    ...options,
    fallbackAngle: getDialAngleFromGradientAngle(options.fallbackAngle ?? 0),
  })
}

export function getDialAngleFromGradientAngle(angle) {
  return normalizeDialAngle(angle)
}
