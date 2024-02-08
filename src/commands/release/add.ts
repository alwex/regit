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
import { promptSelectMultipleFeatures } from '../../services/featureHelpers.js'

const addSingleFeature = async (id: string) => {
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

const addMultipleFeatures = async () => {
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

const action = async (id?: string) => {
    if (id) {
        addSingleFeature(id)
    } else {
        addMultipleFeatures()
    }
}

export default (program: Command) => {
    program.command('add').argument('[feature_id]', 'Feature ID').action(action)
}
