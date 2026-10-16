import { Command } from 'commander'
import { branchRelease } from '../../const.js'
import {
    getCurrentBranch,
    pushBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'

const action = async () => {
    await warmupGitRepo()

    const currentBranch = await getCurrentBranch()

    if (!currentBranch.startsWith(branchRelease)) {
        throw new Error('You must be on a release branch to push a release')
    }

    await pushBranch(currentBranch)
}

export default (program: Command) => {
    program.command('push').action(action)
}
