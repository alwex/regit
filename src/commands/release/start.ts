import { Command } from 'commander'
import { branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    getOpenReleaseBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import {
    promptSelectNextVersionWithConfirmation,
    startRelease,
    validateVersion,
} from '../../services/releaseHelpers.js'

const resolveVersion = async (version?: string) => {
    if (!version) {
        return promptSelectNextVersionWithConfirmation()
    }

    await validateVersion(version)

    return version
}

const action = async (version?: string) => {
    await warmupGitRepo()
    await assertCurrentBranchIsClean()

    const openRelease = await getOpenReleaseBranch()
    if (openRelease) {
        await startRelease({
            version: openRelease.name.replace(branchRelease, ''),
            trigger: 'release-start',
        })
        return
    }

    const versionToUse = await resolveVersion(version)
    await startRelease({
        version: versionToUse.trim(),
        trigger: 'release-start',
    })
}

export default (program: Command) => {
    program.command('start').argument('[version]', 'Version').action(action)
}
