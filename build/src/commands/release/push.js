var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchRelease } from '../../const.js';
import { getCurrentBranch, pushBranch } from '../../services/gitHelpers.js';
const action = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentBranch = yield getCurrentBranch();
    if (!currentBranch.startsWith(branchRelease)) {
        throw new Error('You must be on a release branch to push a release');
    }
    yield pushBranch(currentBranch);
});
export default (program) => {
    program.command('push').action(action);
};
