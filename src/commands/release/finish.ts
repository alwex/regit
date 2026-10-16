import { Command } from 'commander'
import { branchRelease, branchStable } from '../../const.js'
import { git } from '../../services/git.js'
import {
    assertCurrentBranchIsClean,
    createTag,
    deleteBranch,
    getRequiredLatestTag,
    listBranchStartingWith,
    listBranchesInBranch,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import chalk from 'chalk'
import { toFeatureSummary } from '../../services/featureHelpers.js'
import {
    ReleaseFinishContext,
    ReleaseFinishedContext,
    getHooks,
    resolveTagMessage,
    runPostHook,
} from '../../services/hooks.js'

const action = async () => {
    await warmupGitRepo()

    const hooks = await getHooks()

    await assertCurrentBranchIsClean()
    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }

    const { name } = releaseBranches[0]
    const version = name.replace(branchRelease, '')
    const newVersion = `v${version}`

    const features = await listBranchesInBranch(name)

    const canFinishRelease = features.every((feature) => {
        return feature.upToDate
    })
    if (!canFinishRelease) {
        throw new Error(
            'Not all features are merged into the release branch. Please merge all features into the release branch before finishing the release.'
        )
    }

    const context: ReleaseFinishContext = {
        version,
        tag: newVersion,
        previousTag: await getRequiredLatestTag(),
        releaseBranch: name,
        features: features.map(toFeatureSummary),
    }

    await git.checkout(name)
    await hooks.preReleaseFinish(version, context)
    const tagMessage = await resolveTagMessage({ hooks, version, context })

    console.log(chalk.dim(`Push release to origin`))
    await git.push(['-u', 'origin', name])

    console.log(chalk.dim(`Merge release into stable`))
    await startOrCheckoutBranch(branchStable)
    await git.fetch()
    await git.pull()
    await mergeBranch(name)
    await createTag({ tag: newVersion, message: tagMessage })
    await pushBranch(branchStable)
    const stableCommit = await git.revparse([branchStable])

    console.log(chalk.dim(`Delete release branch`))
    await deleteBranch(name)

    console.log(chalk.dim(`Cleanup merged features`))
    for (const feature of context.features) {
        await deleteBranch(feature.branch)
    }

    const finishedContext: ReleaseFinishedContext = {
        ...context,
        stableCommit,
        deletedBranches: [
            name,
            ...context.features.map((feature) => {
                return feature.branch
            }),
        ],
    }

    await runPostHook({
        hook: 'postReleaseFinish',
        completed: `Release ${version} finished`,
        run: () => {
            return hooks.postReleaseFinish(version, finishedContext)
        },
    })
}

export default (program: Command) => {
    program.command('finish').action(action)
}
