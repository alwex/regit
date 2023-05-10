import { Command } from 'commander'
import configureList from './list.js'
import configureStart from './start.js'

export default (program: Command) => {
    const command = program.command('feature')

    configureList(command)
    configureStart(command)
}
