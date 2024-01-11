import configureStart from './start.js';
import configureAdd from './add.js';
import configureStatus from './status.js';
import configureList from './list.js';
import configureRemove from './remove.js';
import configureOpen from './open.js';
export default (program) => {
    const command = program.command('preview');
    configureStart(command);
    configureAdd(command);
    // configureAddMultiple(command)
    configureStatus(command);
    configureList(command);
    configureRemove(command);
    configureOpen(command);
};
