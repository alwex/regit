import { Command } from 'commander'
import semver from 'semver'
import { branchStable } from '../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    initStableBranch,
} from '../services/gitHelpers.js'

const action = async (version: string) => {
    if (!semver.valid(version)) {
        throw new Error('Invalid version number, please use semver')
    }

    await assertCurrentBranchIsClean()

    const stableAlreadyExists = await branchExists(branchStable)
    if (stableAlreadyExists) {
        throw new Error(`${branchStable} branch already exists`)
    }

    const sanitizedVersion = semver.clean(version) as string
    await initStableBranch(`v${sanitizedVersion}`)
}

export default (program: Command) => {
    program
        .command('init')
        .argument('<version>', 'First version')
        .action(action)
}
