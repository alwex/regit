import { Command } from 'commander'
import { branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    mergeBranch,
    pushBranch,
} from '../../services/gitHelpers.js'
import {
    assertPreviewExists,
    promptSelectSinglePreview,
} from '../../services/previewHelpers.js'
import {
    promptSelectNextVersion,
    startRelease,
} from '../../services/releaseHelpers.js'
import { logger } from '../../services/logger.js'

const releasePreviewWithName = async (name: string) => {
    assertPreviewExists(name)

    const previewBranchName = `${branchPreview}${name}`

    const versionToUse = await promptSelectNextVersion(
        'What version do you want to release?'
    )

    const { name: releaseBranchName } = await startRelease(versionToUse)
    await mergeBranch(previewBranchName)

    logger.success(
        `Preview ${previewBranchName} merged into ${releaseBranchName}`
    )

    await pushBranch(releaseBranchName)
}

const releasePreviewWithPrompt = async () => {
    const selectedPreview = await promptSelectSinglePreview(
        'Select preview to release'
    )

    const previewName = selectedPreview.replace(branchPreview, '')

    await releasePreviewWithName(previewName)
}

const action = async (name?: string) => {
    await assertCurrentBranchIsClean()
    if (name) {
        await releasePreviewWithName(name)
    } else {
        await releasePreviewWithPrompt()
    }
}

export default (program: Command) => {
    program
        .command('release')
        .argument('[name]', 'Name')
        .description('Create a release branch from a preview branch')
        .action(action)
}
