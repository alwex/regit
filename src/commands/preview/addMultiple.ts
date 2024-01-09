import { Command } from 'commander'
import { branchFeature, branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    listBranchStartingWith,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { Separator, checkbox } from '@inquirer/prompts'
import { formatFeatureForDisplay } from '../../services/helpers.js'

const action = async (name: string) => {
    await assertCurrentBranchIsClean()

    const previewBranchName = `${branchPreview}${name}`

    const previewExist = await branchExists(previewBranchName)
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`)
    }

    await startOrCheckoutBranch(previewBranchName)
    const allFeatures = await listBranchStartingWith(branchFeature)
    const getAllRemoteNames = allFeatures.map(async (feature) => {
        const formattedName = await formatFeatureForDisplay(feature)

        return {
            name: formattedName,
            value: feature.name,
        }
    })

    const allFeaturesWithRemoteNames = await Promise.all(getAllRemoteNames)

    const selectedFeatures = await checkbox({
        message: `Select features to add to preview ${previewBranchName}`,
        choices: allFeaturesWithRemoteNames,
    })

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

export default (program: Command) => {
    program
        .command('add-multiple')
        .argument('<name>', 'Preview Name')
        .action(action)
}
