var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { select } from '@inquirer/prompts';
import { branchPreview } from '../const.js';
import { listBranchStartingWith } from './gitHelpers.js';
export const promptSelectSinglePreview = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const allBranches = yield listBranchStartingWith(branchPreview);
    const selectedFeature = yield select({
        message,
        choices: allBranches.map((branch) => {
            return {
                name: branch.name,
                value: branch.name,
            };
        }),
    });
    return selectedFeature;
});
