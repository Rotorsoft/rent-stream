import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      exclude: [
        'packages/web',
      ],
      reporter: ['text', 'json', 'html'],
    },
  },
})
