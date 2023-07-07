var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchPreview, branchStable } from '../../const.js';
import { assertCurrentBranchIsClean, branchExists, deleteBranch, getCurrentBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const branchName = `${branchPreview}${name}`;
    yield assertCurrentBranchIsClean();
    const previewBranchExists = yield branchExists(branchName);
    if (!previewBranchExists) {
        throw new Error(`Preview ${name} does not exist`);
    }
    const currentBranch = yield getCurrentBranch();
    if (currentBranch === branchName) {
        yield startOrCheckoutBranch(branchStable);
    }
    yield deleteBranch(branchName);
    logger.success(`Preview ${name} removed`);
});
export default (program) => {
    program.command('remove').argument('<name>', 'Preview name').action(action);
};
