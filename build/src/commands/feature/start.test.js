var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { test } from 'vitest';
import { makeProgram } from '../../program.js';
test('feature start', () => __awaiter(void 0, void 0, void 0, function* () {
    const program = makeProgram();
    program.configureOutput({
        writeOut(str) {
            console.log(`writeOut: ${str}`);
            return '';
        },
        outputError(str, write) {
            console.log(`outputError: ${str}`);
            return '';
        },
    });
    const result = yield program.parseAsync([
        'node',
        'regit',
        'feature',
        'start',
        'proute',
    ]);
}));
