import { Command } from 'commander'
import { branchFeature, branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { promptSelectMultipleFeatures } from '../../services/featureHelpers.js'

const addSingleFeature = async (name: string, id: string) => {
    const previewBranchName = `${branchPreview}${name}`

    const previewExist = await branchExists(previewBranchName)
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`)
    }

    await startOrCheckoutBranch(previewBranchName)

    const featureBranchName = `${branchFeature}${id}`
    const featureExists = await branchExists(featureBranchName)
    if (!featureExists) {
        throw new Error(`Feature ${id} does not exist`)
    }

    await mergeBranch(featureBranchName)
    await pushBranch(previewBranchName)

    logger.success(`Feature ${id} merged into ${previewBranchName}`)
}

const addMultipleFeatures = async (name: string) => {
    const previewBranchName = `${branchPreview}${name}`

    const previewExist = await branchExists(previewBranchName)
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`)
    }

    await startOrCheckoutBranch(previewBranchName)

    const selectedFeatures = await promptSelectMultipleFeatures(
        `Select features to add to preview ${previewBranchName}`
    )

    for (const featureBranchName of selectedFeatures) {
        const featureExists = await branchExists(featureBranchName)
        if (!featureExists) {
            throw new Error(`Feature ${featureBranchName} does not exist`)
        }
        await mergeBranch(featureBranchName)
        await pushBranch(previewBranchName)
        logger.success(
            `Feature ${featureBranchName} merged into ${previewBranchName}`
        )
    }
}

const action = async (name: string, id?: string) => {
    await assertCurrentBranchIsClean()
    if (id) {
        addSingleFeature(name, id)
    } else {
        addMultipleFeatures(name)
    }
}

export default (program: Command) => {
    program
        .command('add')
        .argument('<name>', 'Preview Name')
        .argument('[feature_id]', 'Feature ID')
        .action(action)
}
