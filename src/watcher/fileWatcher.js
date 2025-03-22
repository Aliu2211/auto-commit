const chokidar = require('chokidar');
const config = require('../config/config');
const logger = require('../utils/logger');
const { addChanges, commitChanges, pushChanges } = require('../utils/gitUtils');

function watchFiles() {
  const watcher = chokidar.watch(config.repoPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });

  watcher
    .on('change', filePath => {
      logger.info(`File ${filePath} has been changed`);
      handleFileChange(filePath);
    })
    .on('error', error => logger.error(`Watcher error: ${error}`));
}

async function handleFileChange(filePath) {
  await addChanges(filePath);
  await commitChanges();
  await pushChanges();
}

module.exports = watchFiles;