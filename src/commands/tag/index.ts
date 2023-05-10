import { Command } from 'commander'
import configureList from './list.js'

export default (program: Command) => {
    const command = program.command('tag')

    configureList(command)
}
