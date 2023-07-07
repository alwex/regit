import { Command } from 'commander'
import { branchFeature, branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    listBranchStartingWith,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'

const action = async (id: string) => {
    await assertCurrentBranchIsClean()

    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }
    const currentReleaseBranch = releaseBranches[0]
    const { from, name, show } = currentReleaseBranch

    await startOrCheckoutBranch(name)

    const branchName = `${branchFeature}${id}`
    const featureExists = await branchExists(branchName)
    if (!featureExists) {
        throw new Error(`Feature ${id} does not exist`)
    }

    await mergeBranch(branchName)
    await pushBranch(name)

    logger.success(`Feature ${id} merged into ${from}`)
}

export default (program: Command) => {
    program.command('add').argument('<feature_id>', 'Feature ID').action(action)
}
