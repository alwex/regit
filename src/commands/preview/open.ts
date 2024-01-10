import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { promptSelectSinglePreview } from '../../services/helpers.js'
import { logger } from '../../services/logger.js'

const action = async () => {
    await assertCurrentBranchIsClean()

    const selectedPreview = await promptSelectSinglePreview(
        'Select preview to open'
    )
    await startOrCheckoutBranch(selectedPreview)

    logger.success(`Preview ${selectedPreview} open`)
}

export default (program: Command) => {
    program.command('open').action(action)
}
