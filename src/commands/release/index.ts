import { Command } from 'commander'

import configureStart from './start.js'
import configureAdd from './add.js'
import configureAddMultiple from './addMultiple.js'
import configureStatus from './status.js'
import configureFinish from './finish.js'
import configureRemove from './remove.js'
import configurePush from './push.js'

export default (program: Command) => {
    const command = program.command('release')

    configureStart(command)
    configureAdd(command)
    configureAddMultiple(command)
    configureStatus(command)
    configureFinish(command)
    configureRemove(command)
    configurePush(command)
}
