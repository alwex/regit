import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import { getCurrentBranch, pushBranch } from '../../services/gitHelpers.js'

const action = async () => {
    const currentBranch = await getCurrentBranch()

    if (!currentBranch.startsWith(branchFeature)) {
        throw new Error('You must be on a feature branch to push a features')
    }

    await pushBranch(currentBranch)
}

export default (program: Command) => {
    program.command('push').action(action)
}
