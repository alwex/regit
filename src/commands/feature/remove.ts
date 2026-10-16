import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { assertFeatureExists } from '../../services/featureHelpers.js'
import { FeatureRemoveContext, getHooks } from '../../services/hooks.js'
import { removeBranchWithHooks } from '../../services/removeHelpers.js'

const action = async (id: string) => {
    await warmupGitRepo()

    const hooks = await getHooks()

    const branchName = `${branchFeature}${id}`
    await assertCurrentBranchIsClean()
    await assertFeatureExists(id)

    const context: FeatureRemoveContext = { id, branch: branchName }
    await removeBranchWithHooks({
        branch: branchName,
        completed: `Feature ${id} removed`,
        pre: () => {
            return hooks.preFeatureRemove(id, context)
        },
        post: {
            hook: 'postFeatureRemove',
            run: () => {
                return hooks.postFeatureRemove(id, context)
            },
        },
    })
}

export default (program: Command) => {
    program
        .command('remove')
        .argument('<feature_id>', 'Feature ID')
        .action(action)
}
