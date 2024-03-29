import { Command } from 'commander'
import configureStart from './start.js'
import configureAdd from './add.js'
import configureStatus from './status.js'
import configureList from './list.js'
import configureRemove from './remove.js'
import configureRelease from './release.js'

export default (program: Command) => {
    const command = program.command('preview')

    configureStart(command)
    configureAdd(command)
    configureStatus(command)
    configureList(command)
    configureRemove(command)
    configureRelease(command)
}
