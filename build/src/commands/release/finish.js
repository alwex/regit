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
import { assertCurrentBranchIsClean, createTag, deleteBranch, listBranchStartingWith, listBranchesInBranch, mergeBranch, pushBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import chalk from 'chalk';
import { getHooks } from '../../services/hooks.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    yield assertCurrentBranchIsClean();
    const releaseBranches = yield listBranchStartingWith(branchRelease);
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found');
    }
    const currentReleaseBranch = releaseBranches[0];
    const { from, name, show } = currentReleaseBranch;
    const newVersion = `v${name.split('-')[1]}`;
    const result = yield listBranchesInBranch(name);
    const features = result.filter((data) => data.name.startsWith(branchFeature));
    const canFinishRelease = features.every((feature) => feature.upToDate);
    if (!canFinishRelease) {
        throw new Error('Not all features are merged into the release branch. Please merge all features into the release branch before finishing the release.');
    }
    const version = name.split('-')[1];
    yield hooks.preReleaseFinish(version);
    // push the release branch
    console.log(chalk.dim(`Push release to origin`));
    yield git.push(['-u', 'origin', name]);
    // mege the release branch into stable
    console.log(chalk.dim(`Merge release into stable`));
    yield startOrCheckoutBranch(branchStable);
    yield git.fetch();
    yield git.pull();
    yield mergeBranch(name);
    yield createTag(newVersion, features.map((data) => data.name));
    yield pushBranch(branchStable);
    console.log(chalk.dim(`Delete release branch`));
    yield deleteBranch(name);
    // cleanup merged features
    console.log(chalk.dim(`Cleanup merged features`));
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        yield deleteBranch(feature.name);
    }
    yield hooks.postReleaseFinish(version);
});
export default (program) => {
    program.command('finish').action(action);
};
