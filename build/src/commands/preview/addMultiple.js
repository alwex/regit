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
import { assertCurrentBranchIsClean, branchExists, mergeBranch, pushBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { promptSelectMultipleFeatures } from '../../services/featureHelpers.js';
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const previewBranchName = `${branchPreview}${name}`;
    const previewExist = yield branchExists(previewBranchName);
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`);
    }
    yield startOrCheckoutBranch(previewBranchName);
    const selectedFeatures = yield promptSelectMultipleFeatures(`Select features to add to preview ${previewBranchName}`);
    for (const featureBranchName of selectedFeatures) {
        const featureExists = yield branchExists(featureBranchName);
        if (!featureExists) {
            throw new Error(`Feature ${featureBranchName} does not exist`);
        }
        yield mergeBranch(featureBranchName);
        yield pushBranch(previewBranchName);
        logger.success(`Feature ${featureBranchName} merged into ${previewBranchName}`);
    }
});
export default (program) => {
    program
        .command('add-multiple')
        .argument('<name>', 'Preview Name')
        .action(action);
};
