import chalk from 'chalk'

import {
    ListBranchResult,
    ListBranchesInBranchResult,
    ReleaseHeaderResult,
    TagHeaderResult,
    listBranchStartingWith,
} from './gitHelpers.js'
import { getHooks } from './hooks.js'
import { branchFeature } from '../const.js'
import { checkbox } from '@inquirer/prompts'

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
