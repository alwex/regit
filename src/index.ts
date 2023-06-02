#!/usr/bin/env node

import { makeProgram } from './program.js'
import { logger } from './services/logger.js'

async function run() {
    try {
        const program = makeProgram()
        await program.parseAsync(process.argv)
    } catch (error: any) {
        if (error.exitCode !== 0 && error.code !== 'commander.help') {
            logger.error(error.message)
            process.exit(2)
        }
        process.exit(0)
    }
}
run()
