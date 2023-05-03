import { Command } from 'commander'
import configureList from './list.js'
import configureStart from './start.js'

export default (program: Command) => {
    const feature = program.command('feature')

    configureList(feature)
    configureStart(feature)
}
