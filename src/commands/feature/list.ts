import { Command } from 'commander'
import { listBranchStartingWith } from '../../services/gitHelpers.js'
import { branchFeature } from '../../const.js'
import chalk from 'chalk'
import { displayFeatureBranch } from '../../services/helpers.js'

// Feature: origin/feature-santiago (from v3.7.1) undefined
// /!\ Tags not merged into this branch: at least 'v4.3.6' to 'v4.3.8'.
// commit 739c9a20259e319111977f3aed1b91bf59d84888
// Author: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Tue Jul 26 10:09:39 2022 +1200

const action = async () => {
    const branches = await listBranchStartingWith(branchFeature)

    for (const branch of branches) {
        await displayFeatureBranch(branch)
    }
}

export default (program: Command) => {
    program.command('list').action(action)
}
