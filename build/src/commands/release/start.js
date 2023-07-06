var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchRelease } from '../../const.js';
import { assertCurrentBranchIsClean, getLatestTag, getOpenReleaseBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import semver from 'semver';
import { logger } from '../../services/logger.js';
const action = (version) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield assertCurrentBranchIsClean();
    const openRelease = yield getOpenReleaseBranch();
    if (openRelease) {
        yield startOrCheckoutBranch(openRelease.name);
        logger.warn(`Release already exists ${openRelease.name}`);
    }
    else {
        const latestTag = (_a = (yield getLatestTag())) !== null && _a !== void 0 ? _a : '0.0.0';
        const nextTag = semver.inc(latestTag !== null && latestTag !== void 0 ? latestTag : '0.0.0', 'minor');
        // default to next minor version
        let versionToUse = nextTag;
        if (version) {
            if (!semver.valid(version)) {
                throw new Error(`Invalid version: ${version}`);
            }
            if (!semver.gt(version, latestTag)) {
                throw new Error(`Version ${version} is not greater than the latest tag ${latestTag}`);
            }
            versionToUse = version;
        }
        const branchName = `${branchRelease}${versionToUse}`;
        yield startOrCheckoutBranch(branchName);
        logger.success(`Release ${versionToUse} started`);
    }
});
export default (program) => {
    program.command('start').argument('[version]', 'Version').action(action);
};
