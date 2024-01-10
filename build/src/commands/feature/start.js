var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertCurrentBranchIsClean, getBranchInfo, getLatestTag, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { branchFeature } from '../../const.js';
import { getHooks } from '../../services/hooks.js';
import { logger } from '../../services/logger.js';
import semver from 'semver';
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    yield assertCurrentBranchIsClean();
    const branchName = `${branchFeature}${id}`;
    yield hooks.preFeatureStart(id);
    yield startOrCheckoutBranch(branchName);
    yield hooks.postFeatureStart(id);
    const latestTag = yield getLatestTag();
    const branchInfo = yield getBranchInfo(branchName);
    logger.success(`Feature ${id} started`);
    if (semver.lt(branchInfo.from, latestTag)) {
        logger.warn(`Feature ${branchName} is based on an old release`);
        logger.warn(`Please run: git merge --no-ff ${latestTag} && git push origin ${branchName}`);
    }
});
export default (program) => {
    program
        .command('start')
        .argument('<feature_id>', 'Feature ID')
        .action(action);
};
