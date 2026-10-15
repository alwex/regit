import { Command } from 'commander'
import { branchPreview, branchStable } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    deleteBranch,
    getCurrentBranch,
    listBranchesInBranch,
    startOrCheckoutBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { toFeatureSummary } from '../../services/featureHelpers.js'
import {
    PreviewRemoveContext,
    getHooks,
    runPostHook,
} from '../../services/hooks.js'

const action = async (name: string) => {
    await warmupGitRepo()

    const hooks = await getHooks()

    const branchName = `${branchPreview}${name}`
    await assertCurrentBranchIsClean()

    const previewBranchExists = await branchExists(branchName)
    if (!previewBranchExists) {
        throw new Error(`Preview ${name} does not exist`)
    }

    const features = await listBranchesInBranch(branchName)
    const context: PreviewRemoveContext = {
        preview: name,
        previewBranch: branchName,
        features: features.map(toFeatureSummary),
    }
    await hooks.prePreviewRemove(name, context)

    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    await runPostHook({
        hook: 'postPreviewRemove',
        completed: `Preview ${name} removed`,
        run: () => {
            return hooks.postPreviewRemove(name, context)
        },
    })

    logger.success(`Preview ${name} removed`)
}

export default (program: Command) => {
    program.command('remove').argument('<name>', 'Preview name').action(action)
}
