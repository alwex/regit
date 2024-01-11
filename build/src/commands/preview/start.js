var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertCurrentBranchIsClean, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { promptSelectSinglePreview } from '../../services/helpers.js';
import { branchPreview } from '../../const.js';
const startPreviewWithName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const branchName = `${branchPreview}${name}`;
    yield startOrCheckoutBranch(branchName);
    logger.success(`Preview ${name} started`);
});
const startPreviewWithPrompt = () => __awaiter(void 0, void 0, void 0, function* () {
    const selectedPreview = yield promptSelectSinglePreview('Select preview to open');
    const previewName = selectedPreview.replace(branchPreview, '');
    yield startPreviewWithName(previewName);
});
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    if (name) {
        startPreviewWithName(name);
    }
    else {
        startPreviewWithPrompt();
    }
});
export default (program) => {
    program.command('start').argument('[name]', 'Preview Name').action(action);
};
