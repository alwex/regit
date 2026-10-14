import { branchFeature, branchRelease, branchStable } from '../const.js'
import { git } from './git.js'
import { uniq as removeDuplicate, uniqBy } from './utils.js'
import semver from 'semver'

export const getProjectRootDirectory = async () => {
    const result = await git.revparse(['--show-toplevel'])

    return result
}

export const warmupGitRepo = async () => {
    await git.fetch()
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

const findHeaderValue = (lines: string[], prefix: string) => {
    const line = lines.find((current) => {
        return current.startsWith(prefix)
    })

    return line ? line.slice(prefix.length).trim() : ''
}

export const getBranchDetails = async (branch: string) => {
    const result = await git.show([branch])
    const lines = result.split('\n')

    return {
        commit: findHeaderValue(lines, 'commit '),
        author: findHeaderValue(lines, 'Author:'),
        date: findHeaderValue(lines, 'Date:'),
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
        author: findHeaderValue(lines, 'Tagger:'),
        date: findHeaderValue(lines, 'Date:'),
    } as TagHeaderResult
}

export const createTag = async ({
    tag,
    message,
}: {
    tag: string
    message: string
}) => {
    await git.addAnnotatedTag(tag, message)
    await git.push(['origin', tag])
}

export const branchExists = async (branchName: string) => {
    const isLocal = await localBranchExists(branchName)
    const isRemote = await remoteBranchExists(branchName)

    return isLocal || isRemote
}

export const localBranchExists = async (branchName: string) => {
    const result = await git.branch()
    const isLocal = result.all.find((branch) => {
        return branch === branchName
    })

    return Boolean(isLocal)
}

export const remoteBranchExists = async (branchName: string) => {
    const result = await git.branch()
    const isRemote = result.all.find((branch) => {
        return branch === `remotes/origin/${branchName}`
    })

    return Boolean(isRemote)
}

export const initStableBranch = async () => {
    await git.checkoutLocalBranch(branchStable)
}

export const pushStableBranch = async (version: string) => {
    await git.raw(['add', './.regit'])
    await git.raw(['commit', '-m', `[regit] Init ${version}`])
    await git.push(['-u', 'origin', branchStable])
    await createTag({ tag: version, message: `[regit] ${version}. ()` })
}

export interface ListBranchResult {
    name: string
    remoteName?: string
    from: string
    show: string[]
    isPresentLocally: boolean
}

const getLatestTagMergedInto = async (ref: string) => {
    const mergedTags = await git.raw(['tag', '--merged', ref])

    return mergedTags.trim().split('\n').sort(semver.rcompare)[0].trim()
}

export const getBranchInfo = async (branchName: string) => {
    const from = await getLatestTagMergedInto(`origin/${branchName}`)

    const show = await git.show([`origin/${branchName}`])

    const showDetails = show.trim().split('\n').slice(0, 3)

    const isPresentLocally = await localBranchExists(branchName)

    return {
        name: branchName.replace('remotes/origin/', ''),
        from,
        show: showDetails,
        remoteName: '',
        isPresentLocally,
    }
}

export const listBranchStartingWith = async (branchName: string) => {
    const data: ListBranchResult[] = []

    const result = await git.branch()

    const allBranches = result.all
        .filter((branch) => {
            return (
                branch.startsWith(branchName) ||
                branch.startsWith(`remotes/origin/${branchName}`)
            )
        })
        .map((branch) => {
            return branch.replace('remotes/origin/', '')
        })

    const branches = removeDuplicate(allBranches)

    for (let i = 0; i < branches.length; i++) {
        const name = branches[i]
        const branchData = await getBranchInfo(name)

        data.push(branchData)
    }

    const uniq = uniqBy(data, 'name')

    return uniq
}

export type BranchOrigin = 'new' | 'local' | 'remote'

export type BranchInspection = {
    branch: string
    origin: BranchOrigin
    baseTag: string
    latestTag: string
    isOutdated: boolean
}

export const getRequiredLatestTag = async () => {
    const latestTag = await getLatestTag()
    if (!latestTag) {
        throw new Error('No release tag found, run regit init first')
    }

    return latestTag
}

const getBranchOrigin = async (branch: string): Promise<BranchOrigin> => {
    if (await localBranchExists(branch)) {
        return 'local'
    }

    if (await remoteBranchExists(branch)) {
        return 'remote'
    }

    return 'new'
}

const getBaseTag = async ({
    branch,
    origin,
    latestTag,
}: {
    branch: string
    origin: BranchOrigin
    latestTag: string
}) => {
    if (origin === 'new') {
        return latestTag
    }

    if (origin === 'local') {
        return getLatestTagMergedInto(branch)
    }

    return getLatestTagMergedInto(`origin/${branch}`)
}

export const inspectBranch = async (
    branch: string
): Promise<BranchInspection> => {
    const latestTag = await getRequiredLatestTag()
    const origin = await getBranchOrigin(branch)
    const baseTag = await getBaseTag({ branch, origin, latestTag })

    return {
        branch,
        origin,
        baseTag,
        latestTag,
        isOutdated: semver.lt(baseTag, latestTag),
    }
}

export const startInspectedBranch = async ({
    branch,
    origin,
    latestTag,
}: BranchInspection) => {
    if (origin !== 'new') {
        console.log(`Branch ${branch} already exists`)
        await git.checkout(branch)
        return
    }

    console.log(`Creating Branch ${branch} from tag ${latestTag}`)
    await git.checkoutBranch(branch, `tags/${latestTag}`)
    await git.commit(`[regit] Init '${branch}'`, {
        '--allow-empty': null,
    })
    await git.push(['-u', 'origin', branch])
}

export const startOrCheckoutBranch = async (branchName: string) => {
    await startInspectedBranch(await inspectBranch(branchName))
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

    if (!firstCommit || !lastCommit) {
        return []
    }

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
    const isPresentLocally = await localBranchExists(branchName)
    if (isPresentLocally) {
        await git.deleteLocalBranch(branchName, true)
    }

    await git.push(['origin', '--delete', branchName])
}
