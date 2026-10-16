var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchStable } from '../const.js';
import { deleteBranch, getCurrentBranch, startOrCheckoutBranch, } from './gitHelpers.js';
import { runPostHook } from './hooks.js';
import { logger } from './logger.js';
export const removeBranchWithHooks = ({ branch, completed, pre, post, }) => __awaiter(void 0, void 0, void 0, function* () {
    yield pre();
    const currentBranch = yield getCurrentBranch();
    if (currentBranch === branch) {
        yield startOrCheckoutBranch(branchStable);
    }
    yield deleteBranch(branch);
    yield runPostHook(Object.assign(Object.assign({}, post), { completed }));
    logger.success(completed);
});
