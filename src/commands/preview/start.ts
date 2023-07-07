import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'

const action = async (name: string) => {
    await assertCurrentBranchIsClean()

    const branchName = `preview-${name}`
    await startOrCheckoutBranch(branchName)
    logger.success(`Preview ${name} started`)
}

export default (program: Command) => {
    program.command('start').argument('<name>', 'Preview Name').action(action)
}
