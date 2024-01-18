var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from 'chalk';
import semver from 'semver';
import { getLatestTag, listBranchStartingWith, } from './gitHelpers.js';
import { getHooks } from './hooks.js';
import { branchFeature, branchPreview } from '../const.js';
import { checkbox, select } from '@inquirer/prompts';
export const getRemoteFeatureName = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    const name = yield hooks.getFeatureName(branch);
    return name;
});
export const formatFeatureForDisplay = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, name, show } = branch;
    const remoteName = yield getRemoteFeatureName(name);
    return chalk.bold(`Feature: origin/${name} ${chalk.dim(`(from ${from})`)} ${chalk.blue(remoteName)}`);
});
export const displayFeatureBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, name, show } = branch;
    // const remoteName = await getRemoteFeatureName(name)
    const formattedFeatureName = yield formatFeatureForDisplay(branch);
    console.log(formattedFeatureName);
    show.forEach((showLine) => {
        console.log(showLine);
    });
    // new line
    console.log('');
});
export const displaySubFeatureBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, name, show } = branch;
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`    - origin/${branch.name} ${branch.upToDate
        ? chalk.green('[merged]')
        : chalk.yellow('[in progress]')} ${chalk.blue(remoteName)}`));
});
export const displayTagFeatureBranch = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`    - ${name} ${chalk.blue(remoteName)}`));
});
export const displayReleaseHeader = (releaseHeader, releaseBranch) => {
    const { author, date } = releaseHeader;
    const { name, from } = releaseBranch;
    console.log(`${chalk.bold(`Release: origin/${name}`)} (from ${from})`);
    console.log(`Author: ${author}`);
    console.log(`Date: ${date}`);
    console.log(chalk.bold(`Included features:`));
};
export const displayTagHeader = (tagHeader) => {
    const { tag, author, date } = tagHeader;
    console.log(chalk.bold(`Tag: ${tag}`));
    console.log(`Tagger: ${author}`);
    console.log(`Date: ${date}`);
    console.log(`Included features:`);
};
export const promptSelectMultipleFeatures = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const allFeatures = yield listBranchStartingWith(branchFeature);
    const getAllRemoteNames = allFeatures.map((feature) => __awaiter(void 0, void 0, void 0, function* () {
        const formattedName = yield formatFeatureForDisplay(feature);
        return {
            name: formattedName,
            value: feature.name,
        };
    }));
    const allFeaturesWithRemoteNames = yield Promise.all(getAllRemoteNames);
    const selectedFeatures = yield checkbox({
        message,
        choices: allFeaturesWithRemoteNames,
    });
    return selectedFeatures;
});
export const promptSelectSingleFeature = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const allFeatures = yield listBranchStartingWith(branchFeature);
    const getAllRemoteNames = allFeatures.map((feature) => __awaiter(void 0, void 0, void 0, function* () {
        const formattedName = yield formatFeatureForDisplay(feature);
        return {
            name: formattedName,
            value: feature.name,
        };
    }));
    const allFeaturesWithRemoteNames = yield Promise.all(getAllRemoteNames);
    const selectedFeature = yield select({
        message,
        choices: allFeaturesWithRemoteNames,
    });
    return selectedFeature;
});
export const promptSelectSinglePreview = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const allBranches = yield listBranchStartingWith(branchPreview);
    const selectedFeature = yield select({
        message,
        choices: allBranches.map((branch) => {
            return {
                name: branch.name,
                value: branch.name,
            };
        }),
    });
    return selectedFeature;
});
export const promptSelectNextVersion = (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const latestTag = (_a = (yield getLatestTag())) !== null && _a !== void 0 ? _a : '0.0.0';
    const nextMajorTag = semver.inc(latestTag, 'major');
    const nextMinorTag = semver.inc(latestTag, 'minor');
    const nextPatchTag = semver.inc(latestTag, 'patch');
    const selectedVersion = yield select({
        message,
        choices: [
            {
                name: `Minor ${nextMinorTag}`,
                value: nextMinorTag,
            },
            {
                name: `Patch ${nextPatchTag}`,
                value: nextPatchTag,
            },
            {
                name: `Major ${nextMajorTag}`,
                value: nextMajorTag,
            },
        ],
    });
    return selectedVersion;
});
