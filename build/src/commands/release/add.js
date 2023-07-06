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
import { assertCurrentBranchIsClean, branchExists, listBranchStartingWith, mergeBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
const action = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const releaseBranches = yield listBranchStartingWith(branchRelease);
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found');
    }
    const currentReleaseBranch = releaseBranches[0];
    const { from, name, show } = currentReleaseBranch;
    yield startOrCheckoutBranch(name);
    const branchName = `${branchFeature}${id}`;
    const featureExists = yield branchExists(branchName);
    if (!featureExists) {
        throw new Error(`Feature ${id} does not exist`);
    }
    yield mergeBranch(branchName);
    logger.success(`Feature ${id} merged into ${from}`);
});
export default (program) => {
    program.command('add').argument('<feature_id>', 'Feature ID').action(action);
};
