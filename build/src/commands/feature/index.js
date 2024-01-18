import configureStatus from './status.js';
import configureList from './list.js';
import configureStart from './start.js';
import configureRemove from './remove.js';
import configurePush from './push.js';
export default (program) => {
    const command = program.command('feature');
    configureStatus(command);
    configureList(command);
    configureStart(command);
    configureRemove(command);
    configurePush(command);
};
