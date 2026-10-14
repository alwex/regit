import { Command } from 'commander'
import { branchFeature, branchRelease } from '../../const.js'
import {
    assertFeatureExists,
    promptSelectMultipleFeatures,
    summarizeFeatures,
} from '../../services/featureHelpers.js'
import {
    assertCurrentBranchIsClean,
    mergeBranch,
    pushBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import {
    ReleaseAddContext,
    getHooks,
    runPostHook,
} from '../../services/hooks.js'
import { logger } from '../../services/logger.js'
import { openRelease } from '../../services/releaseHelpers.js'

const mergeFeaturesIntoRelease = async ({
    releaseBranch,
    featureBranches,
}: {
    releaseBranch: string
    featureBranches: string[]
}) => {
    const hooks = await getHooks()
    const version = releaseBranch.replace(branchRelease, '')
    const context: ReleaseAddContext = {
        version,
        releaseBranch,
        features: await summarizeFeatures(featureBranches),
    }

    await hooks.preReleaseAdd(version, context)

    for (const feature of context.features) {
        await mergeBranch(feature.branch)
        logger.success(`Feature ${feature.id} merged into ${releaseBranch}`)
    }
    await pushBranch(releaseBranch)

    await runPostHook({
        hook: 'postReleaseAdd',
        completed: `Merged ${featureBranches.join(', ')} into ${releaseBranch}`,
        run: () => {
            return hooks.postReleaseAdd(version, context)
        },
    })
}

const addSingleFeature = async (id: string) => {
    await assertCurrentBranchIsClean()
    const { name } = await openRelease()

    await assertFeatureExists(id)

    await mergeFeaturesIntoRelease({
        releaseBranch: name,
        featureBranches: [`${branchFeature}${id}`],
    })
}

const addMultipleFeatures = async () => {
    await assertCurrentBranchIsClean()

    const { name } = await openRelease()

    const selectedFeatures = await promptSelectMultipleFeatures(
        `Select features to add to release ${name}`
    )

    await mergeFeaturesIntoRelease({
        releaseBranch: name,
        featureBranches: selectedFeatures,
    })
}

const action = async (id?: string) => {
    await warmupGitRepo()

    if (id) {
        await addSingleFeature(id)
    } else {
        await addMultipleFeatures()
    }
}

export default (program: Command) => {
    program.command('add').argument('[feature_id]', 'Feature ID').action(action)
}
