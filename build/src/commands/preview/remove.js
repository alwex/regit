var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchPreview } from '../../const.js';
import { assertCurrentBranchIsClean, branchExists, listBranchesInBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { toFeatureSummary } from '../../services/featureHelpers.js';
import { getHooks } from '../../services/hooks.js';
import { removeBranchWithHooks } from '../../services/removeHelpers.js';
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    const hooks = yield getHooks();
    const branchName = `${branchPreview}${name}`;
    yield assertCurrentBranchIsClean();
    const previewBranchExists = yield branchExists(branchName);
    if (!previewBranchExists) {
        throw new Error(`Preview ${name} does not exist`);
    }
    const features = yield listBranchesInBranch(branchName);
    const context = {
        preview: name,
        previewBranch: branchName,
        features: features.map(toFeatureSummary),
    };
    yield removeBranchWithHooks({
        branch: branchName,
        completed: `Preview ${name} removed`,
        pre: () => {
            return hooks.prePreviewRemove(name, context);
        },
        post: {
            hook: 'postPreviewRemove',
            run: () => {
                return hooks.postPreviewRemove(name, context);
            },
        },
    });
});
export default (program) => {
    program.command('remove').argument('<name>', 'Preview name').action(action);
};
