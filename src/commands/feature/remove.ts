import { Command } from 'commander'
import { branchFeature, branchStable } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    deleteBranch,
    getCurrentBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'

const action = async (id: string) => {
    const branchName = `${branchFeature}${id}`
    await assertCurrentBranchIsClean()

    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    logger.success(`Feature ${id} removed`)
}

export default (program: Command) => {
    program
        .command('remove')
        .argument('<feature_id>', 'Feature ID')
        .action(action)
}
