import { Command } from 'commander'
import { branchPreview } from '../../const.js'
import { assertCurrentBranchIsClean } from '../../services/gitHelpers.js'
import { promptSelectSinglePreview } from '../../services/previewHelpers.js'
import { promptSelectNextVersion } from '../../services/releaseHelpers.js'

const releasePreviewWithName = async (name: string) => {
    const previewBranchName = `${branchPreview}${name}`

    const versionToUse = await promptSelectNextVersion(
        'What version do you want to release?'
    )
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
