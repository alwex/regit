import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    inspectBranch,
    startInspectedBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { branchPreview } from '../../const.js'
import { promptSelectSinglePreview } from '../../services/previewHelpers.js'
import {
    PreviewStartContext,
    getHooks,
    runPostHook,
} from '../../services/hooks.js'

const startPreviewWithName = async (name: string) => {
    const hooks = await getHooks()
    const branchName = `${branchPreview}${name}`
    const inspection = await inspectBranch(branchName)
    const context: PreviewStartContext = { kind: 'preview', id: name, ...inspection }

    await hooks.prePreviewStart(name, context)
    await startInspectedBranch(inspection)
    logger.success(`Preview ${name} started`)

    await runPostHook({
        hook: 'postPreviewStart',
        completed: `Preview ${name} started`,
        run: () => {
            return hooks.postPreviewStart(name, context)
        },
    })
}

const startPreviewWithPrompt = async () => {
    const selectedPreview = await promptSelectSinglePreview(
        'Select preview to open'
    )

    const previewName = selectedPreview.replace(branchPreview, '')

    await startPreviewWithName(previewName)
}

const action = async (name?: string) => {
    await warmupGitRepo()
    await assertCurrentBranchIsClean()
    if (name) {
        await startPreviewWithName(name)
    } else {
        await startPreviewWithPrompt()
    }
}

export default (program: Command) => {
    program.command('start').argument('[name]', 'Preview Name').action(action)
}
