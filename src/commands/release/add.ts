import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import {
    assertFeatureExists,
    promptSelectMultipleFeatures,
} from '../../services/featureHelpers.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    mergeBranch,
    pushBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { openRelease } from '../../services/releaseHelpers.js'

const addSingleFeature = async (id: string) => {
    await assertCurrentBranchIsClean()
    const { name, from } = await openRelease()

    await assertFeatureExists(id)

    const branchName = `${branchFeature}${id}`
    await mergeBranch(branchName)
    await pushBranch(name)

    logger.success(`Feature ${id} merged into ${from}`)
}

const addMultipleFeatures = async () => {
    await assertCurrentBranchIsClean()

    const { name, from } = await openRelease()

    const selectedFeatures = await promptSelectMultipleFeatures(
        `Select features to add to release ${name}`
    )

    for (const featureBranchName of selectedFeatures) {
        const featureExists = await branchExists(featureBranchName)
        if (!featureExists) {
            throw new Error(`Feature ${featureBranchName} does not exist`)
        }

        await mergeBranch(featureBranchName)

        logger.success(`Feature ${featureBranchName} merged into ${from}`)
    }
    await pushBranch(name)
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
