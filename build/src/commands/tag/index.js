import configureList from './list.js';
export default (program) => {
    const command = program.command('tag');
    configureList(command);
};
