import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    getBranchInfo,
    getLatestTag,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { branchFeature } from '../../const.js'
import { getHooks } from '../../services/hooks.js'
import { logger } from '../../services/logger.js'
import semver from 'semver'
import { promptSelectSingleFeature } from '../../services/featureHelpers.js'

const startFeatureWithId = async (id: string) => {
    const hooks = await getHooks()

    await assertCurrentBranchIsClean()
    const branchName = `${branchFeature}${id}`

    await hooks.preFeatureStart(id)
    await startOrCheckoutBranch(branchName)
    await hooks.postFeatureStart(id)

    const latestTag = await getLatestTag()
    const branchInfo = await getBranchInfo(branchName)

    logger.success(`Feature ${id} started`)
    if (semver.lt(branchInfo.from, latestTag!)) {
        logger.warn(`Feature ${branchName} is based on an old release`)
        logger.warn(
            `Please run: git merge --no-ff ${latestTag} && git push origin ${branchName}`
        )
    }
}

const startFeatureWithPrompt = async () => {
    const selectedFeatures = await promptSelectSingleFeature(
        `Select features to start from`
    )
    const featureId = selectedFeatures.replace(branchFeature, '')

    await startFeatureWithId(featureId)
}

const action = async (id?: string) => {
    if (id) {
        startFeatureWithId(id)
    } else {
        startFeatureWithPrompt()
    }
}

export default (program: Command) => {
    program
        .command('start')
        .argument('[feature_id]', 'Feature ID')
        .action(action)
}
