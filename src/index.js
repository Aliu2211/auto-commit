const watchFiles = require('./watcher/fileWatcher');
const logger = require('./utils/logger');

logger.info('Starting auto-commit library...');
watchFiles();