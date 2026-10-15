import { Command } from 'commander'
import { branchFeature, branchStable } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    deleteBranch,
    getCurrentBranch,
    startOrCheckoutBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import { assertFeatureExists } from '../../services/featureHelpers.js'
import {
    FeatureRemoveContext,
    getHooks,
    runPostHook,
} from '../../services/hooks.js'

const action = async (id: string) => {
    await warmupGitRepo()

    const hooks = await getHooks()

    const branchName = `${branchFeature}${id}`
    await assertCurrentBranchIsClean()
    await assertFeatureExists(id)

    const context: FeatureRemoveContext = { id, branch: branchName }
    await hooks.preFeatureRemove(id, context)

    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    await runPostHook({
        hook: 'postFeatureRemove',
        completed: `Feature ${id} removed`,
        run: () => {
            return hooks.postFeatureRemove(id, context)
        },
    })

    logger.success(`Feature ${id} removed`)
}

export default (program: Command) => {
    program
        .command('remove')
        .argument('<feature_id>', 'Feature ID')
        .action(action)
}
