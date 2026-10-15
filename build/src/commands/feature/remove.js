var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature, branchStable } from '../../const.js';
import { assertCurrentBranchIsClean, deleteBranch, getCurrentBranch, startOrCheckoutBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { assertFeatureExists } from '../../services/featureHelpers.js';
import { getHooks, runPostHook, } from '../../services/hooks.js';
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    const hooks = yield getHooks();
    const branchName = `${branchFeature}${id}`;
    yield assertCurrentBranchIsClean();
    yield assertFeatureExists(id);
    const context = { id, branch: branchName };
    yield hooks.preFeatureRemove(id, context);
    const currentBranch = yield getCurrentBranch();
    if (currentBranch === branchName) {
        yield startOrCheckoutBranch(branchStable);
    }
    yield deleteBranch(branchName);
    yield runPostHook({
        hook: 'postFeatureRemove',
        completed: `Feature ${id} removed`,
        run: () => {
            return hooks.postFeatureRemove(id, context);
        },
    });
    logger.success(`Feature ${id} removed`);
});
export default (program) => {
    program
        .command('remove')
        .argument('<feature_id>', 'Feature ID')
        .action(action);
};
