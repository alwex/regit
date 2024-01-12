import { Command } from 'commander'
import { branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { promptSelectMultipleFeatures } from '../../services/helpers.js'
import { logger } from '../../services/logger.js'

const action = async (name: string) => {
    await assertCurrentBranchIsClean()

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

export default (program: Command) => {
    program
        .command('add-multiple')
        .argument('<name>', 'Preview Name')
        .action(action)
}
