// git branch --no-color -r --merged origin/release-1.1.0
import { Command } from 'commander'
import { branchFeature, branchRelease } from '../../const.js'
import {
    getBranchDetails,
    listBranchStartingWith,
    listBranchesInBranch,
} from '../../services/gitHelpers.js'
import {
    displayReleaseHeader,
    displaySubFeatureBranch,
} from '../../services/helpers.js'

const action = async () => {
    const releaseBranches = await listBranchStartingWith(branchRelease)
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found')
    }

    const currentReleaseBranch = releaseBranches[0]
    const { name } = currentReleaseBranch

    const details = await getBranchDetails(name)

    const result = await listBranchesInBranch(currentReleaseBranch.name)
    const branches = result.filter((data) =>
        data.name.startsWith(branchFeature)
    )

    displayReleaseHeader(details, currentReleaseBranch)

    for (const branch of branches) {
        await displaySubFeatureBranch(branch)
    }
}

export default (program: Command) => {
    program.command('status').action(action)
}
