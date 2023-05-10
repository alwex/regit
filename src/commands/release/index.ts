import { Command } from 'commander'

import configureStart from './start.js'
import configureAdd from './add.js'
import configureStatus from './status.js'
import configureFinish from './finish.js'

export default (program: Command) => {
    const command = program.command('release')

    configureStart(command)
    configureAdd(command)
    configureStatus(command)
    configureFinish(command)
}
