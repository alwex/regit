import { Command } from 'commander'
import { branchFeature, branchRelease, branchStable } from '../../const.js'
import { git } from '../../services/git.js'
import {
    assertCurrentBranchIsClean,
    createTag,
    deleteBranch,
    listBranchStartingWith,
    listBranchesInBranch,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import chalk from 'chalk'
import { getHooks } from '../../services/hooks.js'

const action = async () => {
    const hooks = await getHooks()

    await assertCurrentBranchIsClean()
    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }

    const currentReleaseBranch = releaseBranches[0]
    const { from, name, show } = currentReleaseBranch
    const newVersion = `v${name.split('-')[1]}`

    const result = await listBranchesInBranch(name)
    const features = result.filter((data) =>
        data.name.startsWith(branchFeature)
    )

    const canFinishRelease = features.every((feature) => feature.upToDate)
    if (!canFinishRelease) {
        throw new Error(
            'Not all features are merged into the release branch. Please merge all features into the release branch before finishing the release.'
        )
    }

    const version = name.split('-')[1]

    await hooks.preReleaseFinish(version)

    // push the release branch
    console.log(chalk.dim(`Push release to origin`))
    await git.push(['-u', 'origin', name])

    // mege the release branch into stable
    console.log(chalk.dim(`Merge release into stable`))
    await startOrCheckoutBranch(branchStable)
    await git.fetch()
    await git.pull()
    await mergeBranch(name)
    await createTag(
        newVersion,
        features.map((data) => data.name)
    )
    await pushBranch(branchStable)

    console.log(chalk.dim(`Delete release branch`))
    await deleteBranch(name)

    // cleanup merged features
    console.log(chalk.dim(`Cleanup merged features`))
    for (let i = 0; i < features.length; i++) {
        const feature = features[i]
        await deleteBranch(feature.name)
    }

    await hooks.postReleaseFinish(version)
}

export default (program: Command) => {
    program.command('finish').action(action)
}
