#!/usr/bin/env node

import packageJson from '../package.json' assert { type: 'json' }
import { Command } from 'commander'
import configureInit from './commands/init.js'
import configureFeature from './commands/feature/index.js'

const program = new Command()
program.version(packageJson.version)
program.exitOverride()

configureInit(program)
configureFeature(program)

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
