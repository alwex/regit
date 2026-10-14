var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature, branchRelease, branchStable } from '../../const.js';
import { git } from '../../services/git.js';
import { assertCurrentBranchIsClean, createTag, deleteBranch, getRequiredLatestTag, listBranchStartingWith, listBranchesInBranch, mergeBranch, pushBranch, startOrCheckoutBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import chalk from 'chalk';
import { getHooks } from '../../services/hooks.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    const hooks = yield getHooks();
    yield assertCurrentBranchIsClean();
    const releaseBranches = yield listBranchStartingWith(branchRelease);
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found');
    }
    const { name } = releaseBranches[0];
    const version = name.replace(branchRelease, '');
    const newVersion = `v${version}`;
    const features = yield listBranchesInBranch(name);
    const canFinishRelease = features.every((feature) => {
        return feature.upToDate;
    });
    if (!canFinishRelease) {
        throw new Error('Not all features are merged into the release branch. Please merge all features into the release branch before finishing the release.');
    }
    const context = {
        version,
        tag: newVersion,
        previousTag: yield getRequiredLatestTag(),
        releaseBranch: name,
        features: features.map((feature) => {
            return {
                id: feature.name.replace(branchFeature, ''),
                branch: feature.name,
                baseTag: feature.from,
            };
        }),
    };
    yield git.checkout(name);
    yield hooks.preReleaseFinish(version, context);
    console.log(chalk.dim(`Push release to origin`));
    yield git.push(['-u', 'origin', name]);
    console.log(chalk.dim(`Merge release into stable`));
    yield startOrCheckoutBranch(branchStable);
    yield git.fetch();
    yield git.pull();
    yield mergeBranch(name);
    yield createTag(newVersion, features.map((data) => {
        return data.name;
    }));
    yield pushBranch(branchStable);
    const stableCommit = yield git.revparse([branchStable]);
    console.log(chalk.dim(`Delete release branch`));
    yield deleteBranch(name);
    console.log(chalk.dim(`Cleanup merged features`));
    for (const feature of context.features) {
        yield deleteBranch(feature.branch);
    }
    yield hooks.postReleaseFinish(version, Object.assign(Object.assign({}, context), { stableCommit, deletedBranches: [
            name,
            ...context.features.map((feature) => {
                return feature.branch;
            }),
        ] }));
});
export default (program) => {
    program.command('finish').action(action);
};
