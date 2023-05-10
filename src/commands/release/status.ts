// git branch --no-color -r --merged origin/release-1.1.0
import { Command } from 'commander'
import { branchFeature, branchRelease } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    getBranchDetails,
    listBranchStartingWith,
    listBranchesInBranch,
    mergeBranch,
} from '../../services/gitHelpers.js'
import chalk from 'chalk'

const action = async () => {
    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }
    const currentReleaseBranch = releaseBranches[0]
    const { from, name, show } = currentReleaseBranch

    const details = await getBranchDetails(name)

    const result = await listBranchesInBranch(currentReleaseBranch.name)
    const features = result.filter((data) =>
        data.name.startsWith(branchFeature)
    )

    console.log(`${chalk.bold(`Release: origin/${name}`)} (from ${from})`)
    console.log(`Author: ${details.author}`)
    console.log(`Date: ${details.date}`)
    console.log(chalk.bold(`Included features:`))
    features.forEach((feature) => {
        console.log(
            `    - origin/${feature.name} ${
                feature.upToDate
                    ? chalk.green('[merged]')
                    : chalk.yellow('[in progress]')
            } ${chalk.blue('Feature Title')}`
        )
    })
}

export default (program: Command) => {
    program.command('status').action(action)
}
