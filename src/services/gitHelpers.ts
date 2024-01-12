import { branchFeature, branchRelease, branchStable } from '../const.js'
import { git } from './git.js'
import { uniqBy } from './utils.js'

export const getProjectRootDirectory = async () => {
    const result = await git.revparse(['--show-toplevel'])

    return result
}

export const getCurrentBranch = async () => {
    const result = await git.branch()

    return result.current
}

export const pushBranch = async (branchName: string) => {
    await git.push(['-u', 'origin', branchName])
}

export const getOpenReleaseBranch = async () => {
    const result = await listBranchStartingWith(branchRelease)
    return result[0]
}

export const assertOnSameBranch = async (branch: string) => {
    const currentBranch = await getCurrentBranch()
    if (branch !== currentBranch) {
        throw new Error(`You are not on the branch ${branch}`)
    }
}

export const assertNotOnSameBranch = async (branch: string) => {
    const currentBranch = await getCurrentBranch()
    if (branch === currentBranch) {
        throw new Error(`You are already on the branch ${branch}`)
    }
}

export const assertCurrentBranchIsClean = async () => {
    const statusResult = await git.status()
    const isClean = statusResult.isClean()

    if (!isClean) {
        throw new Error('Current branch is dirty, cannot continue')
    }
}

export const getLatestTag = async () => {
    const tagResult = await git.tags()
    const lastTag = tagResult.latest

    return lastTag
}

export const getLatestTags = async (tagCount: number) => {
    const tagResult = await git.tags()

    return tagResult.all.slice(-tagCount)
}

export interface ReleaseHeaderResult {
    commit: string
    author: string
    date: string
}

export const getBranchDetails = async (branch: string) => {
    const result = await git.show([branch])
    const lines = result.split('\n')

    return {
        commit: lines[0].split(' ')[1].trim(),
        author: lines[1].split(': ')[1].trim(),
        date: lines[2].split(': ')[1].trim(),
    } as ReleaseHeaderResult
}

export interface TagHeaderResult {
    tag: string
    author: string
    date: string
}

export const getTagDetails = async (tag: string) => {
    const result = await git.show([tag])
    const lines = result.split('\n')

    return {
        tag,
        author: lines[1].split(':')[1].trim(),
        date: lines[2].split(': ')[1].trim(),
    } as TagHeaderResult
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

export const getBranchInfo = async (branchName: string) => {
    const from = await git.raw(['describe', '--tags', '--abbrev=0', branchName])
    const show = await git.show([branchName])

    const showDetails = show.trim().split('\n').slice(0, 3)

    return {
        name: branchName.replace('remotes/origin/', ''),
        from: from.trim(),
        show: showDetails,
        remoteName: '',
    }
}

export const listBranchStartingWith = async (branchName: string) => {
    const data: ListBranchResult[] = []

    const result = await git.branch()

    const branches = result.all.filter((branch) => branch.includes(branchName))

    for (let i = 0; i < branches.length; i++) {
        const name = branches[i]
        const branchData = await getBranchInfo(name)

        data.push(branchData)
    }

    const uniq = uniqBy(data, 'name')

    return uniq
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
    const allCommits = await git.raw([
        'reflog',
        'show',
        '--no-abbrev',
        targetBranch,
    ])

    const allCommitsHashes = allCommits
        .trim()
        .split('\n')
        .map((line) => {
            return line.split(' ')[0]
        })

    const firstCommit = allCommitsHashes[allCommitsHashes.length - 1]
    const lastCommit = allCommitsHashes[0]

    const allCommitsOnBranch = await git.log([
        targetBranch,
        `${firstCommit}..${lastCommit}`,
    ])

    const allMergedFeatureNames = allCommitsOnBranch.all
        .filter((branch) => {
            return branch.message.includes(branchFeature)
        })
        .map((branch) => {
            const match = branch.message.match(/'(.*)'/)
            if (match) {
                return match[1]
            }
        })
        .filter(Boolean)
        .map((name) => {
            return name!.replace('origin/', '')
        })

    // get merged and up to date branches
    const allCompletelyMergedFeatures = await git.branch([
        '--no-color',
        '-r',
        '--merged',
        targetBranch,
    ])

    const allCompletelyMergedFeatureNames = allCompletelyMergedFeatures.all
        .filter((name) => {
            return name.includes(branchFeature)
        })
        .map((name) => {
            return name.replace('origin/', '')
        })

    const allPartiallyMergedFeatureNames = allMergedFeatureNames.filter(
        (name) => {
            return !allCompletelyMergedFeatureNames.includes(name!)
        }
    )

    const allFeatures = await listBranchStartingWith(branchFeature)

    const mergedBranches = allFeatures.filter((feature) => {
        return allCompletelyMergedFeatureNames.includes(feature.name)
    })

    const partiallyMergedBranches = allFeatures.filter((feature) => {
        return allPartiallyMergedFeatureNames.includes(feature.name)
    })

    const result: ListBranchesInBranchResult[] = [
        ...mergedBranches.map((feature) => {
            return {
                ...feature,
                upToDate: true,
            }
        }),
        ...partiallyMergedBranches.map((feature) => {
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

    const twgitBranchesCompat = [
        ...result.matchAll(/\[twgit\] Init feature '(.*)'/g),
    ].reduce<string[]>((acc, current) => {
        const branchName = current[1] as string
        acc.push(branchName)

        return acc
    }, [])

    return [...branches, ...twgitBranchesCompat]
}

export const deleteBranch = async (branchName: string) => {
    await git.deleteLocalBranch(branchName, true)
    await git.push(['origin', '--delete', branchName])
}
