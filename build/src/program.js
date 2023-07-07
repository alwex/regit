import { Command } from 'commander';
import configureFeature from './commands/feature/index.js';
import configureInit from './commands/init.js';
import configureRelease from './commands/release/index.js';
import configurePreivew from './commands/preview/index.js';
import configureTag from './commands/tag/index.js';
export const makeProgram = () => {
    const program = new Command();
    program.version('v1.0.0');
    configureInit(program);
    configureFeature(program);
    configurePreivew(program);
    configureRelease(program);
    configureTag(program);
    return program;
};
