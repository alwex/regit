var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchStable } from '../../const.js';
import { assertCurrentBranchIsClean, deleteBranch, getCurrentBranch, getOpenReleaseBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const openRelease = yield getOpenReleaseBranch();
    if (!openRelease) {
        throw new Error('No open release found');
    }
    const branchName = openRelease.name;
    const currentBranch = yield getCurrentBranch();
    if (currentBranch === branchName) {
        yield startOrCheckoutBranch(branchStable);
    }
    yield deleteBranch(branchName);
    logger.success(`Release ${branchName} removed`);
});
export default (program) => {
    program.command('remove').action(action);
};
