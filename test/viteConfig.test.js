import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('vite build config', () => {
  it('为浏览器 IIFE 构建替换 process.env.NODE_ENV', () => {
    const configSource = readFileSync(`${process.cwd()}/vite.config.js`, 'utf8')

    expect(configSource).toContain("'process.env.NODE_ENV': JSON.stringify('production')")
  })
})
