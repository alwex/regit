var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature, branchRelease } from '../../const.js';
import { assertFeatureExists, promptSelectMultipleFeatures, summarizeFeatures, } from '../../services/featureHelpers.js';
import { assertCurrentBranchIsClean, mergeBranch, pushBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { getHooks, runPostHook, } from '../../services/hooks.js';
import { logger } from '../../services/logger.js';
import { openRelease } from '../../services/releaseHelpers.js';
const mergeFeaturesIntoRelease = ({ releaseBranch, featureBranches, }) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    const version = releaseBranch.replace(branchRelease, '');
    const context = {
        version,
        releaseBranch,
        features: yield summarizeFeatures(featureBranches),
    };
    yield hooks.preReleaseAdd(version, context);
    for (const feature of context.features) {
        yield mergeBranch(feature.branch);
        logger.success(`Feature ${feature.id} merged into ${releaseBranch}`);
    }
    yield pushBranch(releaseBranch);
    yield runPostHook({
        hook: 'postReleaseAdd',
        completed: `Merged ${featureBranches.join(', ')} into ${releaseBranch}`,
        run: () => {
            return hooks.postReleaseAdd(version, context);
        },
    });
});
const addSingleFeature = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const { name } = yield openRelease();
    yield assertFeatureExists(id);
    yield mergeFeaturesIntoRelease({
        releaseBranch: name,
        featureBranches: [`${branchFeature}${id}`],
    });
});
const addMultipleFeatures = () => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const { name } = yield openRelease();
    const selectedFeatures = yield promptSelectMultipleFeatures(`Select features to add to release ${name}`);
    yield mergeFeaturesIntoRelease({
        releaseBranch: name,
        featureBranches: selectedFeatures,
    });
});
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    if (id) {
        yield addSingleFeature(id);
    }
    else {
        yield addMultipleFeatures();
    }
});
export default (program) => {
    program.command('add').argument('[feature_id]', 'Feature ID').action(action);
};
