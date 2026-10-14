var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature, branchPreview } from '../../const.js';
import { assertCurrentBranchIsClean, branchExists, mergeBranch, pushBranch, startOrCheckoutBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { promptSelectMultipleFeatures, summarizeFeatures, } from '../../services/featureHelpers.js';
import { getHooks, runPostHook, } from '../../services/hooks.js';
const openPreview = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranchName = `${branchPreview}${name}`;
    const previewExist = yield branchExists(previewBranchName);
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`);
    }
    yield startOrCheckoutBranch(previewBranchName);
    return previewBranchName;
});
const mergeFeaturesIntoPreview = ({ preview, previewBranch, featureBranches, }) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    const context = {
        preview,
        previewBranch,
        features: yield summarizeFeatures(featureBranches),
    };
    yield hooks.prePreviewAdd(preview, context);
    for (const feature of context.features) {
        yield mergeBranch(feature.branch);
        yield pushBranch(previewBranch);
        logger.success(`Feature ${feature.id} merged into ${previewBranch}`);
    }
    yield runPostHook({
        hook: 'postPreviewAdd',
        completed: `Merged ${featureBranches.join(', ')} into ${previewBranch}`,
        run: () => {
            return hooks.postPreviewAdd(preview, context);
        },
    });
});
const addSingleFeature = (name, id) => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranchName = yield openPreview(name);
    const featureBranchName = `${branchFeature}${id}`;
    const featureExists = yield branchExists(featureBranchName);
    if (!featureExists) {
        throw new Error(`Feature ${id} does not exist`);
    }
    yield mergeFeaturesIntoPreview({
        preview: name,
        previewBranch: previewBranchName,
        featureBranches: [featureBranchName],
    });
});
const addMultipleFeatures = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranchName = yield openPreview(name);
    const selectedFeatures = yield promptSelectMultipleFeatures(`Select features to add to preview ${previewBranchName}`);
    yield mergeFeaturesIntoPreview({
        preview: name,
        previewBranch: previewBranchName,
        featureBranches: selectedFeatures,
    });
});
const action = (name, id) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    yield assertCurrentBranchIsClean();
    if (id) {
        yield addSingleFeature(name, id);
    }
    else {
        yield addMultipleFeatures(name);
    }
});
export default (program) => {
    program
        .command('add')
        .argument('<name>', 'Preview Name')
        .argument('[feature_id]', 'Feature ID')
        .action(action);
};
