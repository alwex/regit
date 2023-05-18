import { branchFeature, branchRelease, branchStable } from '../const.js'
import { git } from './git.js'

export const getCurrentBranch = async () => {
    const result = await git.branch()

    return result.current
}

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

export const getLatestTags = async () => {
    const tagResult = await git.tags()

    return tagResult.all
}

export interface ReleaseHeaderResult {
    author: string
    date: string
}

export const getBranchDetails = async (branch: string) => {
    const result = await git.show([branch])
    const lines = result.split('\n')

    return {
        author: lines[2].split(':')[1].trim(),
        date: lines[3].split(': ')[1].trim(),
    } as ReleaseHeaderResult
}
export const getTagDetails = async (tag: string) => {
    const result = await git.show([tag])
    const lines = result.split('\n')

    return {
        author: lines[1].split(':')[1].trim(),
        date: lines[2].split(': ')[1].trim(),
    }
}

export const createTag = async (version: string, included: string[] = []) => {
    await git.addAnnotatedTag(
        version,
        `[regit] ${version}. (${included.join(',')})`
    )
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
    await git.raw(['commit', '--allow-empty', '-m', `[regit] Init ${version}`])
    await git.push(['-u', 'origin', branchStable])
    await createTag(version)
}

export interface ListBranchResult {
    name: string
    remoteName?: string
    from: string
    show: string[]
}

export const listBranchStartingWith = async (branchName: string) => {
    const data: ListBranchResult[] = []

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
            remoteName: '',
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

export const mergeBranch = async (branchName: string) => {
    const result = await git.merge(['--no-ff', `origin/${branchName}`])
}

export interface ListBranchesInBranchResult extends ListBranchResult {
    upToDate: boolean
}

export const listBranchesInBranch = async (
    targetBranch: string
): Promise<ListBranchesInBranchResult[]> => {
    const resultBranches = await git.branch([
        '--no-color',
        '-r',
        '--merged',
        targetBranch,
    ])
    const mergedBranches = resultBranches.all
        .map((branch) => branch.replace('origin/', ''))
        .filter((branch) => branch !== targetBranch)

    const mergedFromCommit = await git.log([
        '--merges',
        `--grep=feature`,
        targetBranch,
    ])

    const foundFeatureBranches = mergedFromCommit.all
        .map((data) => {
            const match = data.message.match(/'(.*)'/)
            if (match) {
                return match[1].replace('origin/', '')
            }
        })
        .filter(Boolean)

    const uniqFeatureBranches = [...new Set(foundFeatureBranches)]

    const allFeatures = await listBranchStartingWith(branchFeature)
    const matchingFeatures = allFeatures.filter((feature) => {
        return uniqFeatureBranches.includes(feature.name)
    })

    const completeMerges = matchingFeatures.filter((feature) => {
        return mergedBranches.includes(feature.name)
    })

    const incompleteMerges = matchingFeatures.filter((feature) => {
        return !mergedBranches.includes(feature.name)
    })

    const result: ListBranchesInBranchResult[] = [
        ...completeMerges.map((feature) => {
            return {
                ...feature,
                upToDate: true,
            }
        }),
        ...incompleteMerges.map((feature) => {
            return {
                ...feature,
                upToDate: false,
            }
        }),
    ]

    return result
}

export const listBranchesBetweenTags = async (tag1: string, tag2: string) => {
    const result = await git.raw([
        'log',
        '--no-merges',
        '--pretty=format:"%s"',
        '--abbrev-commit',
        `${tag1}..${tag2}`,
    ])
    const branches = [...result.matchAll(/\[regit\] Init '(.*)'/g)].reduce<
        string[]
    >((acc, current) => {
        const branchName = current[1] as string
        acc.push(branchName)

        return acc
    }, [])

    return branches
}

export const deleteBranch = async (branchName: string) => {
    await git.deleteLocalBranch(branchName)
    await git.push(['origin', '--delete', branchName])
}
