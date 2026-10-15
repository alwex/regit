var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertCurrentBranchIsClean, inspectBranch, startInspectedBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { branchPreview } from '../../const.js';
import { promptSelectSinglePreview } from '../../services/previewHelpers.js';
import { getHooks, runPostHook, } from '../../services/hooks.js';
const startPreviewWithName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    const branchName = `${branchPreview}${name}`;
    const inspection = yield inspectBranch(branchName);
    const context = Object.assign({ kind: 'preview', id: name }, inspection);
    yield hooks.prePreviewStart(name, context);
    yield startInspectedBranch(inspection);
    yield runPostHook({
        hook: 'postPreviewStart',
        completed: `Preview ${name} started`,
        run: () => {
            return hooks.postPreviewStart(name, context);
        },
    });
    logger.success(`Preview ${name} started`);
});
const startPreviewWithPrompt = () => __awaiter(void 0, void 0, void 0, function* () {
    const selectedPreview = yield promptSelectSinglePreview('Select preview to open');
    const previewName = selectedPreview.replace(branchPreview, '');
    yield startPreviewWithName(previewName);
});
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    yield assertCurrentBranchIsClean();
    if (name) {
        yield startPreviewWithName(name);
    }
    else {
        yield startPreviewWithPrompt();
    }
});
export default (program) => {
    program.command('start').argument('[name]', 'Preview Name').action(action);
};
