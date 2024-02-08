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
import { getBranchDetails, listBranchStartingWith, listBranchesInBranch, } from '../../services/gitHelpers.js';
import { displayReleaseHeader } from '../../services/releaseHelpers.js';
import { displaySubFeatureBranch } from '../../services/featureHelpers.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const releaseBranches = yield listBranchStartingWith(branchRelease);
    if (releaseBranches.length === 0) {
        throw new Error('No release branch found');
    }
    const currentReleaseBranch = releaseBranches[0];
    const { name } = currentReleaseBranch;
    const details = yield getBranchDetails(name);
    const result = yield listBranchesInBranch(currentReleaseBranch.name);
    const branches = result.filter((data) => data.name.startsWith(branchFeature));
    displayReleaseHeader(details, currentReleaseBranch);
    for (const branch of branches) {
        yield displaySubFeatureBranch(branch);
    }
});
export default (program) => {
    program.command('status').action(action);
};
