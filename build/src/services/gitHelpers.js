var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature, branchRelease, branchStable } from '../const.js';
import { git } from './git.js';
import { uniq as removeDuplicate, uniqBy } from './utils.js';
import semver from 'semver';
export const getProjectRootDirectory = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.revparse(['--show-toplevel']);
    return result;
});
export const warmupGitRepo = () => __awaiter(void 0, void 0, void 0, function* () {
    yield git.fetch();
});
export const getCurrentBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.branch();
    return result.current;
});
export const pushBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    yield git.push(['-u', 'origin', branchName]);
});
export const getOpenReleaseBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield listBranchStartingWith(branchRelease);
    return result[0];
});
export const assertOnSameBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const currentBranch = yield getCurrentBranch();
    if (branch !== currentBranch) {
        throw new Error(`You are not on the branch ${branch}`);
    }
});
export const assertNotOnSameBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const currentBranch = yield getCurrentBranch();
    if (branch === currentBranch) {
        throw new Error(`You are already on the branch ${branch}`);
    }
});
export const assertCurrentBranchIsClean = () => __awaiter(void 0, void 0, void 0, function* () {
    const statusResult = yield git.status();
    const isClean = statusResult.isClean();
    if (!isClean) {
        throw new Error('Current branch is dirty, cannot continue');
    }
});
export const getLatestTag = () => __awaiter(void 0, void 0, void 0, function* () {
    const tagResult = yield git.tags();
    const lastTag = tagResult.latest;
    return lastTag;
});
export const getLatestTags = (tagCount) => __awaiter(void 0, void 0, void 0, function* () {
    const tagResult = yield git.tags();
    return tagResult.all.slice(-tagCount);
});
const findHeaderValue = (lines, prefix) => {
    const line = lines.find((current) => {
        return current.startsWith(prefix);
    });
    return line ? line.slice(prefix.length).trim() : '';
};
export const getBranchDetails = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.show([branch]);
    const lines = result.split('\n');
    return {
        commit: findHeaderValue(lines, 'commit '),
        author: findHeaderValue(lines, 'Author:'),
        date: findHeaderValue(lines, 'Date:'),
    };
});
export const getTagDetails = (tag) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.show([tag]);
    const lines = result.split('\n');
    return {
        tag,
        author: findHeaderValue(lines, 'Tagger:'),
        date: findHeaderValue(lines, 'Date:'),
    };
});
export const createTag = ({ tag, message, }) => __awaiter(void 0, void 0, void 0, function* () {
    yield git.addAnnotatedTag(tag, message);
    yield git.push(['origin', tag]);
});
export const branchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const isLocal = yield localBranchExists(branchName);
    const isRemote = yield remoteBranchExists(branchName);
    return isLocal || isRemote;
});
export const localBranchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.branch();
    const isLocal = result.all.find((branch) => {
        return branch === branchName;
    });
    return Boolean(isLocal);
});
export const remoteBranchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.branch();
    const isRemote = result.all.find((branch) => {
        return branch === `remotes/origin/${branchName}`;
    });
    return Boolean(isRemote);
});
export const initStableBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    yield git.checkoutLocalBranch(branchStable);
});
export const pushStableBranch = (version) => __awaiter(void 0, void 0, void 0, function* () {
    yield git.raw(['add', './.regit']);
    yield git.raw(['commit', '-m', `[regit] Init ${version}`]);
    yield git.push(['-u', 'origin', branchStable]);
    yield createTag({ tag: version, message: `[regit] ${version}. ()` });
});
const getLatestTagMergedInto = (ref) => __awaiter(void 0, void 0, void 0, function* () {
    const mergedTags = yield git.raw(['tag', '--merged', ref]);
    return mergedTags.trim().split('\n').sort(semver.rcompare)[0].trim();
});
const resolveRemoteFirstBranchRef = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield remoteBranchExists(branchName)) {
        return `origin/${branchName}`;
    }
    return branchName;
});
const resolveLocalFirstBranchRef = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield localBranchExists(branchName)) {
        return branchName;
    }
    return `origin/${branchName}`;
});
export const getBranchInfo = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const ref = yield resolveRemoteFirstBranchRef(branchName);
    const from = yield getLatestTagMergedInto(ref);
    const show = yield git.show([ref]);
    const showDetails = show.trim().split('\n').slice(0, 3);
    const isPresentLocally = yield localBranchExists(branchName);
    return {
        name: branchName.replace('remotes/origin/', ''),
        ref,
        from,
        show: showDetails,
        remoteName: '',
        isPresentLocally,
    };
});
export const listBranchStartingWith = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const data = [];
    const result = yield git.branch();
    const allBranches = result.all
        .filter((branch) => {
        return (branch.startsWith(branchName) ||
            branch.startsWith(`remotes/origin/${branchName}`));
    })
        .map((branch) => {
        return branch.replace('remotes/origin/', '');
    });
    const branches = removeDuplicate(allBranches);
    for (let i = 0; i < branches.length; i++) {
        const name = branches[i];
        const branchData = yield getBranchInfo(name);
        data.push(branchData);
    }
    const uniq = uniqBy(data, 'name');
    return uniq;
});
export const getRequiredLatestTag = () => __awaiter(void 0, void 0, void 0, function* () {
    const latestTag = yield getLatestTag();
    if (!latestTag) {
        throw new Error('No release tag found, run regit init first');
    }
    return latestTag;
});
const getBranchOrigin = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield localBranchExists(branch)) {
        return 'local';
    }
    if (yield remoteBranchExists(branch)) {
        return 'remote';
    }
    return 'new';
});
const getBaseTag = ({ branch, origin, latestTag, }) => __awaiter(void 0, void 0, void 0, function* () {
    if (origin === 'new') {
        return latestTag;
    }
    if (origin === 'local') {
        return getLatestTagMergedInto(branch);
    }
    return getLatestTagMergedInto(`origin/${branch}`);
});
export const inspectBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const latestTag = yield getRequiredLatestTag();
    const origin = yield getBranchOrigin(branch);
    const baseTag = yield getBaseTag({ branch, origin, latestTag });
    return {
        branch,
        origin,
        baseTag,
        latestTag,
        isOutdated: semver.lt(baseTag, latestTag),
    };
});
export const startInspectedBranch = ({ branch, origin, latestTag, }) => __awaiter(void 0, void 0, void 0, function* () {
    if (origin !== 'new') {
        console.log(`Branch ${branch} already exists`);
        yield git.checkout(branch);
        return;
    }
    console.log(`Creating Branch ${branch} from tag ${latestTag}`);
    yield git.checkoutBranch(branch, `tags/${latestTag}`);
    yield git.commit(`[regit] Init '${branch}'`, {
        '--allow-empty': null,
    });
    yield git.push(['-u', 'origin', branch]);
});
export const startOrCheckoutBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    yield startInspectedBranch(yield inspectBranch(branchName));
});
export const mergeBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.merge(['--no-ff', `origin/${branchName}`]);
});
export const listBranchesInBranch = (targetBranch) => __awaiter(void 0, void 0, void 0, function* () {
    const targetRef = yield resolveLocalFirstBranchRef(targetBranch);
    const allCommits = yield git.raw([
        'reflog',
        'show',
        '--no-abbrev',
        targetRef,
    ]);
    const allCommitsHashes = allCommits
        .trim()
        .split('\n')
        .map((line) => {
        return line.split(' ')[0];
    });
    const firstCommit = allCommitsHashes[allCommitsHashes.length - 1];
    const lastCommit = allCommitsHashes[0];
    if (!firstCommit || !lastCommit) {
        return [];
    }
    const allCommitsOnBranch = yield git.log([
        targetRef,
        `${firstCommit}..${lastCommit}`,
    ]);
    const allMergedFeatureNames = allCommitsOnBranch.all
        .filter((branch) => {
        return branch.message.includes(branchFeature);
    })
        .map((branch) => {
        const match = branch.message.match(/'(.*)'/);
        if (match) {
            return match[1];
        }
    })
        .filter(Boolean)
        .map((name) => {
        return name.replace('origin/', '');
    });
    // get merged and up to date branches
    const allCompletelyMergedFeatures = yield git.branch([
        '--no-color',
        '-r',
        '--merged',
        targetRef,
    ]);
    const allCompletelyMergedFeatureNames = allCompletelyMergedFeatures.all
        .filter((name) => {
        return name.includes(branchFeature);
    })
        .map((name) => {
        return name.replace('origin/', '');
    });
    const allPartiallyMergedFeatureNames = allMergedFeatureNames.filter((name) => {
        return !allCompletelyMergedFeatureNames.includes(name);
    });
    const allFeatures = yield listBranchStartingWith(branchFeature);
    const mergedBranches = allFeatures.filter((feature) => {
        return allCompletelyMergedFeatureNames.includes(feature.name);
    });
    const partiallyMergedBranches = allFeatures.filter((feature) => {
        return allPartiallyMergedFeatureNames.includes(feature.name);
    });
    const result = [
        ...mergedBranches.map((feature) => {
            return Object.assign(Object.assign({}, feature), { upToDate: true });
        }),
        ...partiallyMergedBranches.map((feature) => {
            return Object.assign(Object.assign({}, feature), { upToDate: false });
        }),
    ];
    return result;
});
export const listBranchesBetweenTags = (tag1, tag2) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.raw([
        'log',
        '--no-merges',
        '--pretty=format:"%s"',
        '--abbrev-commit',
        `${tag1}..${tag2}`,
    ]);
    const branches = [...result.matchAll(/\[regit\] Init '(.*)'/g)].reduce((acc, current) => {
        const branchName = current[1];
        acc.push(branchName);
        return acc;
    }, []);
    const twgitBranchesCompat = [
        ...result.matchAll(/\[twgit\] Init feature '(.*)'/g),
    ].reduce((acc, current) => {
        const branchName = current[1];
        acc.push(branchName);
        return acc;
    }, []);
    return [...branches, ...twgitBranchesCompat];
});
export const deleteBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const isPresentLocally = yield localBranchExists(branchName);
    if (isPresentLocally) {
        yield git.deleteLocalBranch(branchName, true);
    }
    const isPresentRemotely = yield remoteBranchExists(branchName);
    if (isPresentRemotely) {
        yield git.push(['origin', '--delete', branchName]);
    }
});
