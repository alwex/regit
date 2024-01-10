import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    getBranchInfo,
    getLatestTag,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { promptSelectSingleFeature } from '../../services/helpers.js'
import { logger } from '../../services/logger.js'
import semver from 'semver'

const action = async () => {
    await assertCurrentBranchIsClean()

    const selectedFeature = await promptSelectSingleFeature(
        'Select feature to open'
    )
    await startOrCheckoutBranch(selectedFeature)

    const latestTag = await getLatestTag()
    const branchInfo = await getBranchInfo(selectedFeature)

    logger.success(`Feature ${selectedFeature} open`)
    if (semver.lt(branchInfo.from, latestTag!)) {
        logger.warn(`Feature ${selectedFeature} is based on an old release`)
        logger.warn(
            `Please run: git merge --no-ff ${latestTag} && git push origin ${selectedFeature}`
        )
    }
}

export default (program: Command) => {
    program.command('open').action(action)
}
