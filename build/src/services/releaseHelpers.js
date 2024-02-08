var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { confirm, select } from '@inquirer/prompts';
import { branchRelease, branchStable } from '../const.js';
import { deleteBranch, getCurrentBranch, getLatestTag, getOpenReleaseBranch, listBranchStartingWith, startOrCheckoutBranch, } from './gitHelpers.js';
import { getHooks } from './hooks.js';
import { logger } from './logger.js';
import semver from 'semver';
import chalk from 'chalk';
export const startRelease = (version) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    yield hooks.preReleaseStart(version);
    const branchName = `${branchRelease}${version}`;
    yield startOrCheckoutBranch(branchName);
    logger.success(`Release ${version} started`);
    yield hooks.postReleaseStart(version);
    return { name: branchName };
});
export const openRelease = () => __awaiter(void 0, void 0, void 0, function* () {
    const releaseBranches = yield listBranchStartingWith(branchRelease);
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found');
    }
    const currentReleaseBranch = releaseBranches[0];
    const { from, name, show } = currentReleaseBranch;
    yield startOrCheckoutBranch(name);
    return { from, name, show };
});
export const removeRelease = () => __awaiter(void 0, void 0, void 0, function* () {
    const openRelease = yield getOpenReleaseBranch();
    if (!openRelease) {
        throw new Error('No open release found');
    }
    const branchName = openRelease.name;
    const currentBranch = yield getCurrentBranch();
    if (currentBranch === branchName) {
        yield startOrCheckoutBranch(branchStable);
    }
    yield deleteBranch(branchName);
    logger.success(`Release ${branchName} removed`);
});
export const validateVersion = (version) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const latestTag = (_a = (yield getLatestTag())) !== null && _a !== void 0 ? _a : '0.0.0';
    if (!semver.valid(version)) {
        throw new Error(`Invalid version: ${version}`);
    }
    if (!semver.gt(version, latestTag)) {
        throw new Error(`Version ${version} is not greater than the latest tag ${latestTag}`);
    }
});
export const promptSelectNextVersion = (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const latestTag = (_b = (yield getLatestTag())) !== null && _b !== void 0 ? _b : '0.0.0';
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
export const promptSelectNextVersionWithConfirmation = () => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const latestTag = (_c = (yield getLatestTag())) !== null && _c !== void 0 ? _c : '0.0.0';
    const versionToUse = yield promptSelectNextVersion('What version do you want to release?');
    const isMajorIncrease = semver.major(versionToUse) > semver.major(latestTag);
    if (isMajorIncrease) {
        const answer = yield confirm({
            message: `Are you sure you want to use the major version (${versionToUse})?`,
            default: false,
        });
        if (!answer) {
            throw new Error('Aborted');
        }
    }
    return versionToUse;
});
export const displayReleaseHeader = (releaseHeader, releaseBranch) => {
    const { author, date } = releaseHeader;
    const { name, from } = releaseBranch;
    console.log(`${chalk.bold(`Release: origin/${name}`)} (from ${from})`);
    console.log(`Author: ${author}`);
    console.log(`Date: ${date}`);
    console.log(chalk.bold(`Included features:`));
};
