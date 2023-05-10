#!/usr/bin/env node

import { Command } from 'commander'
import configureInit from './commands/init.js'
import configureFeature from './commands/feature/index.js'
import configureRelease from './commands/release/index.js'
import configureTag from './commands/tag/index.js'

const program = new Command()
program.version('v1.0.0')
program.exitOverride()

configureInit(program)
configureFeature(program)
configureRelease(program)
configureTag(program)

async function run() {
    try {
        await program.parseAsync(process.argv)
    } catch (error: any) {
        if (error.exitCode !== 0 && error.code !== 'commander.help') {
            console.error(error)
            process.exit(2)
        }
        process.exit(0)
    }
}
run()
