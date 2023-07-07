var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { action as statusAction } from './status.js';
import { listBranchStartingWith } from '../../services/gitHelpers.js';
import { branchPreview } from '../../const.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranches = yield listBranchStartingWith(branchPreview);
    if (previewBranches.length === 0) {
        throw new Error('No preview branches found');
    }
    for (let previewBranch of previewBranches) {
        yield statusAction(previewBranch.name.replace(branchPreview, ''));
        console.log('\n');
    }
});
export default (program) => {
    program.command('list').action(action);
};
