var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import semver from 'semver';
import { branchStable } from '../const.js';
import { assertCurrentBranchIsClean, branchExists, initStableBranch, pushStableBranch, } from '../services/gitHelpers.js';
import { initializeRegitFiles } from '../services/initHelpers.js';
const action = (version) => __awaiter(void 0, void 0, void 0, function* () {
    if (!semver.valid(version)) {
        throw new Error('Invalid version number, please use semver eg 1.0.0');
    }
    yield assertCurrentBranchIsClean();
    const stableAlreadyExists = yield branchExists(branchStable);
    if (stableAlreadyExists) {
        throw new Error(`${branchStable} branch already exists`);
    }
    const sanitizedVersion = semver.clean(version);
    yield initStableBranch();
    yield initializeRegitFiles();
    yield pushStableBranch(`v${sanitizedVersion}`);
});
export default (program) => {
    program
        .command('init')
        .argument('<version>', 'First version')
        .action(action);
};
