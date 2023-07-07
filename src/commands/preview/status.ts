import { Command } from 'commander'
import { branchFeature, branchPreview } from '../../const.js'
import {
    branchExists,
    getBranchDetails,
    listBranchStartingWith,
    listBranchesInBranch,
} from '../../services/gitHelpers.js'
import {
    displayReleaseHeader,
    displaySubFeatureBranch,
} from '../../services/helpers.js'

export const action = async (name: string) => {
    const previewBranchName = `${branchPreview}${name}`
    const previewExist = await branchExists(previewBranchName)
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`)
    }

    const previewBranches = await listBranchStartingWith(branchPreview)
    const previewBranch = previewBranches.find(
        (data) => data.name === previewBranchName
    )!

    const details = await getBranchDetails(previewBranchName)

    const result = await listBranchesInBranch(previewBranchName)
    const branches = result.filter((data) =>
        data.name.startsWith(branchFeature)
    )

    displayReleaseHeader(details, previewBranch)

    for (const branch of branches) {
        await displaySubFeatureBranch(branch)
    }
}

export default (program: Command) => {
    program.command('status').argument('<name>', 'Preview Name').action(action)
}
