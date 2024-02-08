import { select } from '@inquirer/prompts'
import { branchPreview } from '../const.js'
import { listBranchStartingWith } from './gitHelpers.js'

export const promptSelectSinglePreview = async (message: string) => {
    const allBranches = await listBranchStartingWith(branchPreview)

    const selectedFeature = await select({
        message,
        choices: allBranches.map((branch) => {
            return {
                name: branch.name,
                value: branch.name,
            }
        }),
    })

    return selectedFeature
}
