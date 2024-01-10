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
import { uniqBy } from './utils.js';
export const getProjectRootDirectory = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.revparse(['--show-toplevel']);
    return result;
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
export const getBranchDetails = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.show([branch]);
    const lines = result.split('\n');
    return {
        commit: lines[0].split(' ')[1].trim(),
        author: lines[1].split(': ')[1].trim(),
        date: lines[2].split(': ')[1].trim(),
    };
});
export const getTagDetails = (tag) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.show([tag]);
    const lines = result.split('\n');
    return {
        tag,
        author: lines[1].split(':')[1].trim(),
        date: lines[2].split(': ')[1].trim(),
    };
});
export const createTag = (version, included = []) => __awaiter(void 0, void 0, void 0, function* () {
    yield git.addAnnotatedTag(version, `[regit] ${version}. (${included.join(',')})`);
    yield git.push(['origin', version]);
});
export const branchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const isLocal = yield localBranchExists(branchName);
    const isRemote = yield remoteBranchExists(branchName);
    return isLocal || isRemote;
});
export const localBranchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.branch();
    const isLocal = result.all.find((branch) => branch === branchName);
    return Boolean(isLocal);
});
export const remoteBranchExists = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.branch();
    const isRemote = result.all.find((branch) => branch === `remotes/origin/${branchName}`);
    return Boolean(isRemote);
});
export const initStableBranch = (version) => __awaiter(void 0, void 0, void 0, function* () {
    yield git.checkoutLocalBranch(branchStable);
    yield git.raw(['commit', '--allow-empty', '-m', `[regit] Init ${version}`]);
    yield git.push(['-u', 'origin', branchStable]);
    yield createTag(version);
});
export const getBranchInfo = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const from = yield git.raw(['describe', '--tags', '--abbrev=0', branchName]);
    const show = yield git.show([branchName]);
    const showDetails = show.trim().split('\n').slice(0, 3);
    return {
        name: branchName.replace('remotes/origin/', ''),
        from: from.trim(),
        show: showDetails,
        remoteName: '',
    };
});
export const listBranchStartingWith = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const data = [];
    const result = yield git.branch();
    const branches = result.all.filter((branch) => branch.includes(branchName));
    for (let i = 0; i < branches.length; i++) {
        const name = branches[i];
        const branchData = yield getBranchInfo(name);
        data.push(branchData);
    }
    const uniq = uniqBy(data, 'name');
    return uniq;
});
export const startOrCheckoutBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const lastTag = yield getLatestTag();
    const doesBranchExists = yield branchExists(branchName);
    if (doesBranchExists) {
        console.log(`Branch ${branchName} already exists`);
        yield git.checkout(branchName);
    }
    else {
        console.log(`Creating Branch ${branchName} from tag ${lastTag}`);
        yield git.checkoutBranch(branchName, `tags/${lastTag}`);
        yield git.commit(`[regit] Init '${branchName}'`, {
            '--allow-empty': null,
        });
        yield git.push(['-u', 'origin', branchName]);
    }
});
export const mergeBranch = (branchName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield git.merge(['--no-ff', `origin/${branchName}`]);
});
export const listBranchesInBranch = (targetBranch) => __awaiter(void 0, void 0, void 0, function* () {
    const allCommits = yield git.raw([
        'reflog',
        'show',
        '--no-abbrev',
        targetBranch,
    ]);
    const allCommitsHashes = allCommits
        .trim()
        .split('\n')
        .map((line) => {
        return line.split(' ')[0];
    });
    const firstCommit = allCommitsHashes[allCommitsHashes.length - 1];
    const lastCommit = allCommitsHashes[0];
    const allCommitsOnBranch = yield git.log([
        targetBranch,
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
        targetBranch,
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
    yield git.deleteLocalBranch(branchName, true);
    yield git.push(['origin', '--delete', branchName]);
});
