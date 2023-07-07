import { Command } from 'commander'
import { action as statusAction } from './status.js'
import { listBranchStartingWith } from '../../services/gitHelpers.js'
import { branchPreview } from '../../const.js'

const action = async () => {
    const previewBranches = await listBranchStartingWith(branchPreview)

    if (previewBranches.length === 0) {
        throw new Error('No preview branches found')
    }

    for (let previewBranch of previewBranches) {
        await statusAction(previewBranch.name.replace(branchPreview, ''))
        console.log('\n')
    }
}

export default (program: Command) => {
    program.command('list').action(action)
}
