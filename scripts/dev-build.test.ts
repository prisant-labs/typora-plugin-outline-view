// @vitest-environment node

import * as esbuild from 'esbuild'
import typoraPlugin from 'esbuild-plugin-typora'
import { describe, expect, it } from 'vitest'

describe('development build compatibility', () => {
  it('bundles the Outline View through the Community Plugin development transformer', async () => {
    const result = await esbuild.build({
      entryPoints: ['src/views/outline-view.ts'],
      bundle: true,
      format: 'esm',
      plugins: [typoraPlugin({ mode: 'development' })],
      write: false,
    })

    expect(result.outputFiles).toHaveLength(1)
    expect(result.outputFiles[0].text).toContain('OutlineView = class')
  })
})
