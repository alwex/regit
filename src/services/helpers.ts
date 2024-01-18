import chalk from 'chalk'
import semver from 'semver'
import {
    ListBranchResult,
    ListBranchesInBranchResult,
    ReleaseHeaderResult,
    TagHeaderResult,
    getLatestTag,
    getProjectRootDirectory,
    listBranchStartingWith,
} from './gitHelpers.js'
import { getHooks } from './hooks.js'
import { branchFeature, branchPreview } from '../const.js'
import { checkbox, select } from '@inquirer/prompts'
import fs from 'fs'
import { hooksTemplate } from '../templates/hooks.js'

export const getRemoteFeatureName = async (branch: string) => {
    const hooks = await getHooks()
    const name = await hooks.getFeatureName(branch)

    return name
}

export const formatFeatureForDisplay = async (branch: ListBranchResult) => {
    const { from, name, show } = branch
    const remoteName = await getRemoteFeatureName(name)
    return chalk.bold(
        `Feature: origin/${name} ${chalk.dim(`(from ${from})`)} ${chalk.blue(
            remoteName
        )}`
    )
}

export const displayFeatureBranch = async (branch: ListBranchResult) => {
    const { from, name, show } = branch
    // const remoteName = await getRemoteFeatureName(name)

    const formattedFeatureName = await formatFeatureForDisplay(branch)
    console.log(formattedFeatureName)
    show.forEach((showLine) => {
        console.log(showLine)
    })
    // new line
    console.log('')
}

export const displaySubFeatureBranch = async (
    branch: ListBranchesInBranchResult
) => {
    const { from, name, show } = branch
    const remoteName = await getRemoteFeatureName(name)

    console.log(
        chalk.bold(
            `    - origin/${branch.name} ${
                branch.upToDate
                    ? chalk.green('[merged]')
                    : chalk.yellow('[in progress]')
            } ${chalk.blue(remoteName)}`
        )
    )
}

export const displayTagFeatureBranch = async (name: string) => {
    const remoteName = await getRemoteFeatureName(name)

    console.log(chalk.bold(`    - ${name} ${chalk.blue(remoteName)}`))
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

export const displayTagHeader = (tagHeader: TagHeaderResult) => {
    const { tag, author, date } = tagHeader

    console.log(chalk.bold(`Tag: ${tag}`))
    console.log(`Tagger: ${author}`)
    console.log(`Date: ${date}`)
    console.log(`Included features:`)
}

export const promptSelectMultipleFeatures = async (message: string) => {
    const allFeatures = await listBranchStartingWith(branchFeature)
    const getAllRemoteNames = allFeatures.map(async (feature) => {
        const formattedName = await formatFeatureForDisplay(feature)

        return {
            name: formattedName,
            value: feature.name,
        }
    })

    const allFeaturesWithRemoteNames = await Promise.all(getAllRemoteNames)

    const selectedFeatures = await checkbox({
        message,
        choices: allFeaturesWithRemoteNames,
    })

    return selectedFeatures
}

export const promptSelectSingleFeature = async (message: string) => {
    const allFeatures = await listBranchStartingWith(branchFeature)
    const getAllRemoteNames = allFeatures.map(async (feature) => {
        const formattedName = await formatFeatureForDisplay(feature)

        return {
            name: formattedName,
            value: feature.name,
        }
    })

    const allFeaturesWithRemoteNames = await Promise.all(getAllRemoteNames)

    const selectedFeature = await select({
        message,
        choices: allFeaturesWithRemoteNames,
    })

    return selectedFeature
}

export const promptSelectSinglePreview = async (message: string) => {
    const allBranches = await listBranchStartingWith(branchPreview)

    const selectedFeature = await select({
        message,
        choices: allBranches.map((branch) => {
            return {
                name: branch.name,
                value: branch.name,
            }
        }),
    })

    return selectedFeature
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

export const getRegitDirectory = async () => {
    const rootDir = await getProjectRootDirectory()
    const regitFolder = `${rootDir}/.regit`

    return regitFolder
}

export const initializeRegitFiles = async () => {
    const regitFolder = await getRegitDirectory()
    const hookFile = `${regitFolder}/hooks.js`

    const hasRegitDirectory = fs.existsSync(regitFolder)
    if (!hasRegitDirectory) {
        fs.mkdirSync(regitFolder)
    }

    fs.writeFileSync(hookFile, hooksTemplate.trimStart())
}
