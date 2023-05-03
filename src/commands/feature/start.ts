import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { branchFeature } from '../../const.js'

const action = async (id: string) => {
    await assertCurrentBranchIsClean()
    const branchName = `${branchFeature}${id}`
    await startOrCheckoutBranch(branchName)
}

export default (program: Command) => {
    program
        .command('start')
        .argument('<feature_id>', 'Feature ID')
        .action(action)
}
