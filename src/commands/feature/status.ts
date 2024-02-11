import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import {
    getBranchInfo,
    getCurrentBranch,
    getLatestTag,
    listBranchStartingWith,
} from '../../services/gitHelpers.js'
import semver from 'semver'
import { displayFeatureBranch } from '../../services/featureHelpers.js'
import { logger } from '../../services/logger.js'

// Feature: origin/feature-santiago (from v3.7.1) undefined
// /!\ Tags not merged into this branch: at least 'v4.3.6' to 'v4.3.8'.
// commit 739c9a20259e319111977f3aed1b91bf59d84888
// Author: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Tue Jul 26 10:09:39 2022 +1200

const action = async () => {
    const currentBranch = await getCurrentBranch()

    if (!currentBranch.startsWith(branchFeature)) {
        throw new Error('You must be on a feature branch to list features')
    }

    const branches = await listBranchStartingWith(currentBranch)
    const selectedBranch = branches[0]
    await displayFeatureBranch(selectedBranch)

    const branchName = selectedBranch.name
    const latestTag = await getLatestTag()
    const branchInfo = await getBranchInfo(branchName)

    if (semver.lt(branchInfo.from, latestTag!)) {
        logger.warn(`Feature ${branchName} is based on an old release`)
        logger.warn(
            `Please run: git merge --no-ff ${latestTag} && git push origin ${branchName}`
        )
    }
}

export default (program: Command) => {
    program.command('status').action(action)
}
