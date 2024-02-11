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
import { assertFeatureExists, promptSelectMultipleFeatures, } from '../../services/featureHelpers.js';
import { assertCurrentBranchIsClean, branchExists, mergeBranch, pushBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { openRelease } from '../../services/releaseHelpers.js';
const addSingleFeature = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const { name, from } = yield openRelease();
    yield assertFeatureExists(id);
    const branchName = `${branchFeature}${id}`;
    yield mergeBranch(branchName);
    yield pushBranch(name);
    logger.success(`Feature ${id} merged into ${from}`);
});
const addMultipleFeatures = () => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const { name, from } = yield openRelease();
    const selectedFeatures = yield promptSelectMultipleFeatures(`Select features to add to release ${name}`);
    for (const featureBranchName of selectedFeatures) {
        const featureExists = yield branchExists(featureBranchName);
        if (!featureExists) {
            throw new Error(`Feature ${featureBranchName} does not exist`);
        }
        yield mergeBranch(featureBranchName);
        logger.success(`Feature ${featureBranchName} merged into ${from}`);
    }
    yield pushBranch(name);
});
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (id) {
        addSingleFeature(id);
    }
    else {
        addMultipleFeatures();
    }
});
export default (program) => {
    program.command('add').argument('[feature_id]', 'Feature ID').action(action);
};
