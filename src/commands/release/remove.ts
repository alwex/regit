import { Command } from 'commander'
import { assertCurrentBranchIsClean } from '../../services/gitHelpers.js'
import { removeRelease } from '../../services/releaseHelpers.js'

const action = async () => {
    await assertCurrentBranchIsClean()
    await removeRelease()
}

export default (program: Command) => {
    program.command('remove').action(action)
}
