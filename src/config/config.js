require('dotenv').config();
const path = require('path');
const fs = require('fs');

/**
 * Finds the Git repository root by traversing up from the current directory
 * @returns {string} Path to the Git repository root
 */
function findGitRoot() {
  let currentDir = process.cwd();
  
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, '.git'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // If no .git directory is found, return current working directory
  return process.cwd();
}

const config = {
  // Automatically detect the Git repository
  repoPath: findGitRoot(),
  commitMessage: process.env.COMMIT_MESSAGE || 'Auto-saved changes',
  push: process.env.PUSH === 'true' || false,
  remote: process.env.REMOTE || 'origin',
  branch: process.env.BRANCH || 'main',
  autoCommitPrefix: process.env.AUTO_COMMIT_PREFIX || 'WIP:',
  squashOnExit: process.env.SQUASH_ON_EXIT === 'true' || false,
  productName: process.env.PRODUCT_NAME || '',
  autoGenerateMessages: true // Always generate messages based on changes
};

module.exports = config;