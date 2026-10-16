import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import {
    getCurrentBranch,
    pushBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { getHooks, runPostHook } from '../../services/hooks.js'

const action = async () => {
    await warmupGitRepo()

    const currentBranch = await getCurrentBranch()

    if (!currentBranch.startsWith(branchFeature)) {
        throw new Error('You must be on a feature branch to push a features')
    }

    const hooks = await getHooks()
    const id = currentBranch.replace(branchFeature, '')

    await pushBranch(currentBranch)

    await runPostHook({
        hook: 'postFeaturePush',
        completed: `Feature ${id} pushed`,
        run: () => {
            return hooks.postFeaturePush(id, { id, branch: currentBranch })
        },
    })
}

export default (program: Command) => {
    program.command('push').action(action)
}
