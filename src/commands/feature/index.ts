import { Command } from 'commander'
import configureStatus from './status.js'
import configureList from './list.js'
import configureStart from './start.js'
import configureRemove from './remove.js'
import configurePush from './push.js'
import configureOpen from './open.js'

export default (program: Command) => {
    const command = program.command('feature')

    configureStatus(command)
    configureList(command)
    configureStart(command)
    configureRemove(command)
    configurePush(command)
    configureOpen(command)
}
