import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { branchFeature } from '../../const.js'
import { getHooks } from '../../services/hooks.js'

const action = async (id: string) => {
    const hooks = await getHooks()

    await assertCurrentBranchIsClean()
    const branchName = `${branchFeature}${id}`

    await hooks.preFeatureStart(id)
    await startOrCheckoutBranch(branchName)
    await hooks.postFeatureStart(id)
}

export default (program: Command) => {
    program
        .command('start')
        .argument('<feature_id>', 'Feature ID')
        .action(action)
}
