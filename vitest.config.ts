import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globalSetup: ['./test/global-setup.ts'],
        setupFiles: ['./test/setup.ts'],
        env: { FORCE_COLOR: '0' },
        disableConsoleIntercept: true,
        slowTestThreshold: 1000,
        testTimeout: 15000,
    },
})
