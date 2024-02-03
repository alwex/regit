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
import { promptSelectNextVersion } from '../../services/helpers.js'
import { confirm } from '@inquirer/prompts'
import { getHooks } from '../../services/hooks.js'

const action = async (version: string) => {
    const hooks = await getHooks()

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
        } else {
            versionToUse = await promptSelectNextVersion(
                'What version do you want to release?'
            )

            const isMajorIncrease =
                semver.major(versionToUse) > semver.major(latestTag)
            if (isMajorIncrease) {
                const answer = await confirm({
                    message: `Are you sure you want to use the major version (${versionToUse})?`,
                    default: false,
                })
                if (!answer) {
                    throw new Error('Aborted')
                }
            }
        }

        await hooks.preReleaseStart(version)

        const branchName = `${branchRelease}${versionToUse}`
        await startOrCheckoutBranch(branchName)
        logger.success(`Release ${versionToUse} started`)

        await hooks.postReleaseStart(version)
    }
}

export default (program: Command) => {
    program.command('start').argument('[version]', 'Version').action(action)
}
