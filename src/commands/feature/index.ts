import { Command } from 'commander'
import configureStatus from './status.js'
import configureList from './list.js'
import configureStart from './start.js'

export default (program: Command) => {
    const command = program.command('feature')

    configureStatus(command)
    configureList(command)
    configureStart(command)
}