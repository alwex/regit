import { branchStable } from '../const.js'
import {
    deleteBranch,
    getCurrentBranch,
    startOrCheckoutBranch,
} from './gitHelpers.js'
import { Hooks, runPostHook } from './hooks.js'
import { logger } from './logger.js'

export const removeBranchWithHooks = async ({
    branch,
    completed,
    pre,
    post,
}: {
    branch: string
    completed: string
    pre: () => Promise<void>
    post: { hook: keyof Hooks; run: () => Promise<void> }
}) => {
    await pre()

    const currentBranch = await getCurrentBranch()
    if (currentBranch === branch) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branch)
    await runPostHook({ ...post, completed })

    logger.success(completed)
}
