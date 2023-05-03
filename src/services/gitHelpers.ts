import { branchStable } from '../const.js'
import { git } from './git.js'

export const assertCurrentBranchIsClean = async () => {
    const statusResult = await git.status()
    const isClean = statusResult.isClean()

    if (!isClean) {
        throw new Error('Cannot start feature from a dirty branch')
    }
}

export const getLatestTag = async () => {
    const tagResult = await git.tags()
    const lastTag = tagResult.latest

    return lastTag
}

export const createTag = async (version: string) => {
    await git.addAnnotatedTag(version, `[regit] ${version}.`)
    await git.push(['origin', version])
}

export const branchExists = async (branchName: string) => {
    const isLocal = await localBranchExists(branchName)
    const isRemote = await remoteBranchExists(branchName)

    return isLocal || isRemote
}

export const localBranchExists = async (branchName: string) => {
    const result = await git.branch()
    const isLocal = result.all.find((branch) => branch === branchName)

    return Boolean(isLocal)
}

export const remoteBranchExists = async (branchName: string) => {
    const result = await git.branch()
    const isRemote = result.all.find(
        (branch) => branch === `remotes/origin/${branchName}`
    )

    return Boolean(isRemote)
}

export const initStableBranch = async (version: string) => {
    await git.checkoutLocalBranch(branchStable)
    await git.push(['-u', 'origin', branchStable])
    await createTag(version)
}

interface ListBranchStartingWithResult {
    name: string
    from: string
    show: string[]
}

export const listBranchStargingWith = async (branchName: string) => {
    const data: ListBranchStartingWithResult[] = []

    const result = await git.branch()

    const branches = result.all.filter((branch) =>
        branch.startsWith(branchName)
    )

    for (let i = 0; i < branches.length; i++) {
        const name = branches[i]
        const from = await git.raw(['describe', '--tags', '--abbrev=0', name])
        const show = await git.show([name])

        const showDetails = show.trim().split('\n').slice(0, 3)

        data.push({
            name,
            from: from.trim(),
            show: showDetails,
        })
    }

    return data
}

export const startOrCheckoutBranch = async (branchName: string) => {
    const lastTag = await getLatestTag()
    const doesBranchExists = await branchExists(branchName)

    if (doesBranchExists) {
        console.log(`Branch ${branchName} already exists`)
        await git.checkout(branchName)
    } else {
        console.log(`Creating Branch ${branchName} from tag ${lastTag}`)
        await git.checkoutBranch(branchName, `tags/${lastTag}`)
        await git.commit(`[regit] Init '${branchName}'`, {
            '--allow-empty': null,
        })
        await git.push(['-u', 'origin', branchName])
    }
}
