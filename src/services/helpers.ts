import chalk from 'chalk'
import {
    ListBranchResult,
    ListBranchesInBranchResult,
    ReleaseHeaderResult,
} from './gitHelpers.js'
import axios from 'axios'

export const getRemoteFeatureName = async (branch: string) => {
    const api = `https://random-word-api.vercel.app/api?words=4`

    const result = await axios.get(api)

    return result.data.toString().replaceAll(',', '-')
}

export const displayFeatureBranch = async (branch: ListBranchResult) => {
    const { from, name, show } = branch
    const remoteName = await getRemoteFeatureName(name)

    console.log(
        chalk.bold(
            `Feature: origin/${name} ${chalk.dim(
                `(from ${from})`
            )} ${chalk.blue(remoteName)}`
        )
    )
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
