import { Command } from 'commander'
import { branchStable } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    deleteBranch,
    getCurrentBranch,
    getOpenReleaseBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'

const action = async () => {
    await assertCurrentBranchIsClean()
    const openRelease = await getOpenReleaseBranch()
    if (!openRelease) {
        throw new Error('No open release found')
    }

    const branchName = openRelease.name
    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    logger.success(`Release ${branchName} removed`)
}

export default (program: Command) => {
    program.command('remove').action(action)
}
