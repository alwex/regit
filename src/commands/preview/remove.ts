import { Command } from 'commander'
import { branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    listBranchesInBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { toFeatureSummary } from '../../services/featureHelpers.js'
import { PreviewRemoveContext, getHooks } from '../../services/hooks.js'
import { removeBranchWithHooks } from '../../services/removeHelpers.js'

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
    await removeBranchWithHooks({
        branch: branchName,
        completed: `Preview ${name} removed`,
        pre: () => {
            return hooks.prePreviewRemove(name, context)
        },
        post: {
            hook: 'postPreviewRemove',
            run: () => {
                return hooks.postPreviewRemove(name, context)
            },
        },
    })
}

export default (program: Command) => {
    program.command('remove').argument('<name>', 'Preview name').action(action)
}
