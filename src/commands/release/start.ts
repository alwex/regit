import { Command } from 'commander'
import { branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    getLatestTag,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import semver from 'semver'

const action = async () => {
    await assertCurrentBranchIsClean()

    const latestTag = await getLatestTag()
    const nextTag = semver.inc(latestTag ?? '0.0.0', 'minor') as string
    const branchName = `${branchRelease}${nextTag}`
    await startOrCheckoutBranch(branchName)
}

export default (program: Command) => {
    program.command('start').action(action)
}
