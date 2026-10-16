import { Command } from 'commander'
import { branchFeature, branchPreview } from '../../const.js'
import {
    assertCurrentBranchIsClean,
    branchExists,
    mergeBranch,
    pushBranch,
    startOrCheckoutBranch,
    warmupGitRepo,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import {
    promptSelectMultipleFeatures,
    summarizeFeatures,
} from '../../services/featureHelpers.js'
import {
    PreviewAddContext,
    getHooks,
    runPostHook,
} from '../../services/hooks.js'

const openPreview = async (name: string) => {
    const previewBranchName = `${branchPreview}${name}`

    const previewExist = await branchExists(previewBranchName)
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`)
    }

    await startOrCheckoutBranch(previewBranchName)

    return previewBranchName
}

const mergeFeaturesIntoPreview = async ({
    preview,
    previewBranch,
    featureBranches,
}: {
    preview: string
    previewBranch: string
    featureBranches: string[]
}) => {
    const hooks = await getHooks()
    const context: PreviewAddContext = {
        preview,
        previewBranch,
        features: await summarizeFeatures(featureBranches),
    }

    await hooks.prePreviewAdd(preview, context)

    for (const feature of context.features) {
        await mergeBranch(feature.branch)
        await pushBranch(previewBranch)
        logger.success(`Feature ${feature.id} merged into ${previewBranch}`)
    }

    await runPostHook({
        hook: 'postPreviewAdd',
        completed: `Merged ${featureBranches.join(', ')} into ${previewBranch}`,
        run: () => {
            return hooks.postPreviewAdd(preview, context)
        },
    })
}

const addSingleFeature = async (name: string, id: string) => {
    const previewBranchName = await openPreview(name)

    const featureBranchName = `${branchFeature}${id}`
    const featureExists = await branchExists(featureBranchName)
    if (!featureExists) {
        throw new Error(`Feature ${id} does not exist`)
    }

    await mergeFeaturesIntoPreview({
        preview: name,
        previewBranch: previewBranchName,
        featureBranches: [featureBranchName],
    })
}

const addMultipleFeatures = async (name: string) => {
    const previewBranchName = await openPreview(name)

    const selectedFeatures = await promptSelectMultipleFeatures(
        `Select features to add to preview ${previewBranchName}`
    )

    await mergeFeaturesIntoPreview({
        preview: name,
        previewBranch: previewBranchName,
        featureBranches: selectedFeatures,
    })
}

const action = async (name: string, id?: string) => {
    await warmupGitRepo()

    await assertCurrentBranchIsClean()
    if (id) {
        await addSingleFeature(name, id)
    } else {
        await addMultipleFeatures(name)
    }
}

export default (program: Command) => {
    program
        .command('add')
        .argument('<name>', 'Preview Name')
        .argument('[feature_id]', 'Feature ID')
        .action(action)
}
