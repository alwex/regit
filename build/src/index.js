#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { makeProgram } from './program.js';
import { logger } from './services/logger.js';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const program = makeProgram();
            yield program.parseAsync(process.argv);
        }
        catch (error) {
            if (error.exitCode !== 0 && error.code !== 'commander.help') {
                logger.error(error.message);
                process.exit(2);
            }
            process.exit(0);
        }
    });
}
run();
