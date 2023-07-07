import { Command } from 'commander'
import { branchPreview, branchStable } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    deleteBranch,
    getCurrentBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'

const action = async (name: string) => {
    const branchName = `${branchPreview}${name}`
    await assertCurrentBranchIsClean()

    const previewBranchExists = await branchExists(branchName)
    if (!previewBranchExists) {
        throw new Error(`Preview ${name} does not exist`)
    }

    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    logger.success(`Preview ${name} removed`)
}

export default (program: Command) => {
    program.command('remove').argument('<name>', 'Preview name').action(action)
}
