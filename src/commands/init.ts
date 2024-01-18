import { Command } from 'commander'
import semver from 'semver'
import { branchStable } from '../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    initStableBranch,
    pushStableBranch,
} from '../services/gitHelpers.js'
import { initializeRegitFiles } from '../services/helpers.js'

const action = async (version: string) => {
    if (!semver.valid(version)) {
        throw new Error('Invalid version number, please use semver eg 1.0.0')
    }

    await assertCurrentBranchIsClean()

    const stableAlreadyExists = await branchExists(branchStable)
    if (stableAlreadyExists) {
        throw new Error(`${branchStable} branch already exists`)
    }

    const sanitizedVersion = semver.clean(version) as string
    await initStableBranch()
    await initializeRegitFiles()
    await pushStableBranch(`v${sanitizedVersion}`)
}

export default (program: Command) => {
    program
        .command('init')
        .argument('<version>', 'First version')
        .action(action)
}
