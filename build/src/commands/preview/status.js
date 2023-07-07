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
import { branchExists, getBranchDetails, listBranchStartingWith, listBranchesInBranch, } from '../../services/gitHelpers.js';
import { displayReleaseHeader, displaySubFeatureBranch, } from '../../services/helpers.js';
export const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranchName = `${branchPreview}${name}`;
    const previewExist = yield branchExists(previewBranchName);
    if (!previewExist) {
        throw new Error(`Preview ${name} does not exist`);
    }
    const previewBranches = yield listBranchStartingWith(branchPreview);
    const previewBranch = previewBranches.find((data) => data.name === previewBranchName);
    const details = yield getBranchDetails(previewBranchName);
    const result = yield listBranchesInBranch(previewBranchName);
    const branches = result.filter((data) => data.name.startsWith(branchFeature));
    displayReleaseHeader(details, previewBranch);
    for (const branch of branches) {
        yield displaySubFeatureBranch(branch);
    }
});
export default (program) => {
    program.command('status').argument('<name>', 'Preview Name').action(action);
};
