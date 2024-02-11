import { Command } from 'commander'
import {
    assertCurrentBranchIsClean,
    getOpenReleaseBranch,
    startOrCheckoutBranch,
} from '../../services/gitHelpers.js'
import { logger } from '../../services/logger.js'
import {
    promptSelectNextVersionWithConfirmation,
    startRelease,
    validateVersion,
} from '../../services/releaseHelpers.js'

const action = async (version: string) => {
    await assertCurrentBranchIsClean()

    const openRelease = await getOpenReleaseBranch()
    if (openRelease) {
        await startOrCheckoutBranch(openRelease.name)
        logger.warn(`Release already exists ${openRelease.name}`)
    } else {
        let versionToUse = version
        if (version) {
            await validateVersion(version)
            versionToUse = version
        } else {
            versionToUse = await promptSelectNextVersionWithConfirmation()
        }
        console.log('====')
        console.log({ versionToUse })
        await startRelease(versionToUse.trim())
    }
}

export default (program: Command) => {
    program.command('start').argument('[version]', 'Version').action(action)
}
