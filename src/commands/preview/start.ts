import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { branchPreview } from '../../const.js'
import { promptSelectSinglePreview } from '../../services/previewHelpers.js'

const startPreviewWithName = async (name: string) => {
    const branchName = `${branchPreview}${name}`
    await startOrCheckoutBranch(branchName)
    logger.success(`Preview ${name} started`)
}

const startPreviewWithPrompt = async () => {
    const selectedPreview = await promptSelectSinglePreview(
        'Select preview to open'
    )

    const previewName = selectedPreview.replace(branchPreview, '')

    await startPreviewWithName(previewName)
}

const action = async (name?: string) => {
    await assertCurrentBranchIsClean()
    if (name) {
        startPreviewWithName(name)
    } else {
        startPreviewWithPrompt()
    }
}

export default (program: Command) => {
    program.command('start').argument('[name]', 'Preview Name').action(action)
}
