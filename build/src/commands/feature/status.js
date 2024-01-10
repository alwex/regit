var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getBranchInfo, getCurrentBranch, getLatestTag, listBranchStartingWith, } from '../../services/gitHelpers.js';
import { branchFeature } from '../../const.js';
import { displayFeatureBranch, } from '../../services/helpers.js';
import { logger } from '../../services/logger.js';
import semver from 'semver';
// Feature: origin/feature-santiago (from v3.7.1) undefined
// /!\ Tags not merged into this branch: at least 'v4.3.6' to 'v4.3.8'.
// commit 739c9a20259e319111977f3aed1b91bf59d84888
// Author: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Tue Jul 26 10:09:39 2022 +1200
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentBranch = yield getCurrentBranch();
    if (!currentBranch.startsWith(branchFeature)) {
        throw new Error('You must be on a feature branch to list features');
    }
    const branches = yield listBranchStartingWith(currentBranch);
    const selectedBranch = branches[0];
    yield displayFeatureBranch(selectedBranch);
    const branchName = selectedBranch.name;
    const latestTag = yield getLatestTag();
    const branchInfo = yield getBranchInfo(branchName);
    if (semver.lt(branchInfo.from, latestTag)) {
        logger.warn(`Feature ${branchName} is based on an old release`);
        logger.warn(`Please run: git merge --no-ff ${latestTag} && git push origin ${branchName}`);
    }
});
export default (program) => {
    program.command('status').action(action);
};
