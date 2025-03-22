const chokidar = require('chokidar');
const simpleGit = require('simple-git');
const path = require('path');
const { execSync } = require('child_process');

// Function to get the root path of the current Git repository
function getRepoPath() {
  try {
    const repoPath = execSync('git rev-parse --show-toplevel').toString().trim();
    return repoPath;
  } catch (error) {
    console.error('Failed to determine the Git repository path:', error);
    process.exit(1);
  }
}

// Initialize Git repository
const repoPath = getRepoPath();
const repo = simpleGit(repoPath);

// Watch for file changes
const watcher = chokidar.watch(repoPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher
  .on('change', filePath => {
    console.log(`File ${filePath} has been changed`);
    autoCommit(filePath);
  })
  .on('error', error => console.error(`Watcher error: ${error}`));

// Function to handle auto commit
async function autoCommit(filePath) {
  try {
    await repo.add(filePath);
    const message = `Auto-commit: Changes detected in ${path.basename(filePath)}`;
    await repo.commit(message);
    console.log(`Committed changes: ${message}`);

    // Optional: Push changes to remote repository
    // await repo.push('origin', 'main');
  } catch (error) {
    console.error(`Failed to commit changes: ${error}`);
  }
}

// Initialize the watcher
console.log(`Watching for changes in ${repoPath}`);

// This file exports the library for use as a dependency

const watchFiles = require('./src/watcher/fileWatcher');
const gitUtils = require('./src/utils/gitUtils');
const commitValidator = require('./src/utils/commitValidator');
const config = require('./src/config/config');

module.exports = {
  start: watchFiles,
  gitUtils,
  commitValidator,
  config
};