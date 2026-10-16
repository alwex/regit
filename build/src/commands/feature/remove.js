var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature } from '../../const.js';
import { assertCurrentBranchIsClean, warmupGitRepo, } from '../../services/gitHelpers.js';
import { assertFeatureExists } from '../../services/featureHelpers.js';
import { getHooks } from '../../services/hooks.js';
import { removeBranchWithHooks } from '../../services/removeHelpers.js';
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    const hooks = yield getHooks();
    const branchName = `${branchFeature}${id}`;
    yield assertCurrentBranchIsClean();
    yield assertFeatureExists(id);
    const context = { id, branch: branchName };
    yield removeBranchWithHooks({
        branch: branchName,
        completed: `Feature ${id} removed`,
        pre: () => {
            return hooks.preFeatureRemove(id, context);
        },
        post: {
            hook: 'postFeatureRemove',
            run: () => {
                return hooks.postFeatureRemove(id, context);
            },
        },
    });
});
export default (program) => {
    program
        .command('remove')
        .argument('<feature_id>', 'Feature ID')
        .action(action);
};
