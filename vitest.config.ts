import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        setupFiles: ['./test/setup.ts'],
        slowTestThreshold: 3000,
        testTimeout: 20000,
    },
})
