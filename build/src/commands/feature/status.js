var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCurrentBranch, listBranchStartingWith, } from '../../services/gitHelpers.js';
import { branchFeature } from '../../const.js';
import { displayFeatureBranch, } from '../../services/helpers.js';
// Feature: origin/feature-santiago (from v3.7.1) undefined
// /!\ Tags not merged into this branch: at least 'v4.3.6' to 'v4.3.8'.
// commit 739c9a20259e319111977f3aed1b91bf59d84888
// Author: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Tue Jul 26 10:09:39 2022 +1200
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentBranch = yield getCurrentBranch();
    if (!currentBranch.startsWith(branchFeature)) {
        throw new Error('You must be on a feature branch to list features');
    }
    const branches = yield listBranchStartingWith(currentBranch);
    yield displayFeatureBranch(branches[0]);
});
export default (program) => {
    program.command('status').action(action);
};
