import { confirm, select } from '@inquirer/prompts'
import { branchRelease, branchStable } from '../const.js'
import {
    BranchInspection,
    ListBranchResult,
    ReleaseHeaderResult,
    deleteBranch,
    getCurrentBranch,
    getLatestTag,
    getOpenReleaseBranch,
    inspectBranch,
    listBranchStartingWith,
    startInspectedBranch,
    startOrCheckoutBranch,
} from './gitHelpers.js'
import {
    ReleaseStartContext,
    ReleaseTrigger,
    getHooks,
    runPostHook,
} from './hooks.js'
import { logger } from './logger.js'
import semver from 'semver'
import chalk from 'chalk'

const logReleaseStart = ({
    version,
    inspection,
}: {
    version: string
    inspection: BranchInspection
}) => {
    if (inspection.origin === 'new') {
        logger.success(`Release ${version} started`)
        return
    }

    logger.warn(`Release already exists ${inspection.branch}`)
}

export const startRelease = async (
    options: { version: string } & ReleaseTrigger
) => {
    const { version } = options
    const hooks = await getHooks()
    const branchName = `${branchRelease}${version}`
    const inspection = await inspectBranch(branchName)
    const context: ReleaseStartContext = {
        kind: 'release',
        id: version,
        ...options,
        ...inspection,
    }

    await hooks.preReleaseStart(version, context)
    await startInspectedBranch(inspection)
    logReleaseStart({ version, inspection })

    await runPostHook({
        hook: 'postReleaseStart',
        completed: `Release ${version} started`,
        run: () => {
            return hooks.postReleaseStart(version, context)
        },
    })

    return { name: branchName }
}

export const openRelease = async () => {
    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }
    const currentReleaseBranch = releaseBranches[0]
    const { from, name, show } = currentReleaseBranch

    await startOrCheckoutBranch(name)

    return { from, name, show }
}

export const removeRelease = async () => {
    const openRelease = await getOpenReleaseBranch()
    if (!openRelease) {
        throw new Error('No open release found')
    }

    const branchName = openRelease.name
    const currentBranch = await getCurrentBranch()
    if (currentBranch === branchName) {
        await startOrCheckoutBranch(branchStable)
    }

    await deleteBranch(branchName)
    logger.success(`Release ${branchName} removed`)
}

export const validateVersion = async (version: string) => {
    const latestTag = (await getLatestTag()) ?? '0.0.0'

    if (!semver.valid(version)) {
        throw new Error(`Invalid version: ${version}`)
    }

    if (!semver.gt(version, latestTag)) {
        throw new Error(
            `Version ${version} is not greater than the latest tag ${latestTag}`
        )
    }
}

export const promptSelectNextVersion = async (message: string) => {
    const latestTag = (await getLatestTag()) ?? '0.0.0'
    const nextMajorTag = semver.inc(latestTag, 'major') as string
    const nextMinorTag = semver.inc(latestTag, 'minor') as string
    const nextPatchTag = semver.inc(latestTag, 'patch') as string

    const selectedVersion = await select({
        message,
        choices: [
            {
                name: `Minor ${nextMinorTag}`,
                value: nextMinorTag,
            },
            {
                name: `Patch ${nextPatchTag}`,
                value: nextPatchTag,
            },
            {
                name: `Major ${nextMajorTag}`,
                value: nextMajorTag,
            },
        ],
    })

    return selectedVersion
}

export const promptSelectNextVersionWithConfirmation = async () => {
    const latestTag = (await getLatestTag()) ?? '0.0.0'
    const versionToUse = await promptSelectNextVersion(
        'What version do you want to release?'
    )

    const isMajorIncrease = semver.major(versionToUse) > semver.major(latestTag)
    if (isMajorIncrease) {
        const answer = await confirm({
            message: `Are you sure you want to use the major version (${versionToUse})?`,
            default: false,
        })
        if (!answer) {
            throw new Error('Aborted')
        }
    }
    return versionToUse
}

export const displayReleaseHeader = (
    releaseHeader: ReleaseHeaderResult,
    releaseBranch: ListBranchResult
) => {
    const { author, date } = releaseHeader
    const { name, from } = releaseBranch

    console.log(`${chalk.bold(`Release: origin/${name}`)} (from ${from})`)
    console.log(`Author: ${author}`)
    console.log(`Date: ${date}`)
    console.log(chalk.bold(`Included features:`))
}
