import { Command } from 'commander'
import configureFeature from './commands/feature/index.js'
import configureInit from './commands/init.js'
import configureRelease from './commands/release/index.js'
import configurePreivew from './commands/preview/index.js'
import configureTag from './commands/tag/index.js'

const programVersion = process.env.npm_package_version ?? '1.2.5'

export const makeProgram = () => {
    const program = new Command()
    program.version(programVersion)

    configureInit(program)
    configureFeature(program)
    configurePreivew(program)
    configureRelease(program)
    configureTag(program)

    return program
}
