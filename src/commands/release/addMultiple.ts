import { Command } from 'commander'
import { branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    listBranchStartingWith,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { promptSelectMultipleFeatures } from '../../services/helpers.js'
import { logger } from '../../services/logger.js'

const action = async () => {
    await assertCurrentBranchIsClean()

    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }

    const currentReleaseBranch = releaseBranches[0]
    const { from, name, show } = currentReleaseBranch

    await startOrCheckoutBranch(name)

    const selectedFeatures = await promptSelectMultipleFeatures(
        `Select features to add to release ${currentReleaseBranch.name}`
    )

    for (const featureBranchName of selectedFeatures) {
        const featureExists = await branchExists(featureBranchName)
        if (!featureExists) {
            throw new Error(`Feature ${featureBranchName} does not exist`)
        }

        await mergeBranch(featureBranchName)
        await pushBranch(name)

        logger.success(`Feature ${featureBranchName} merged into ${from}`)
    }
}

export default (program: Command) => {
    program.command('add-multiple').action(action)
}
