import { Command } from 'commander'
import { branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    getLatestTag,
    getOpenReleaseBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import semver from 'semver'
import { logger } from '../../services/logger.js'

const action = async (version: string) => {
    await assertCurrentBranchIsClean()

    const openRelease = await getOpenReleaseBranch()
    if (openRelease) {
        await startOrCheckoutBranch(openRelease.name)
        logger.warn(`Release already exists ${openRelease.name}`)
    } else {
        const latestTag = (await getLatestTag()) ?? '0.0.0'
        const nextTag = semver.inc(latestTag ?? '0.0.0', 'minor') as string

        // default to next minor version
        let versionToUse = nextTag

        if (version) {
            if (!semver.valid(version)) {
                throw new Error(`Invalid version: ${version}`)
            }

            if (!semver.gt(version, latestTag)) {
                throw new Error(
                    `Version ${version} is not greater than the latest tag ${latestTag}`
                )
            }

            versionToUse = version
        }

        const branchName = `${branchRelease}${versionToUse}`
        await startOrCheckoutBranch(branchName)
        logger.success(`Release ${versionToUse} started`)
    }
}

export default (program: Command) => {
    program.command('start').argument('[version]', 'Version').action(action)
}
