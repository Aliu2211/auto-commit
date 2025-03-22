const simpleGit = require('simple-git');
const config = require('../config/config');
const logger = require('./logger');
const { validateCommitMessage } = require('./commitValidator');
const { generateCommitMessage } = require('./commitMessageGenerator');

const repo = simpleGit(config.repoPath);

async function addChanges(filePath) {
  try {
    await repo.add(filePath);
    logger.info(`Added changes in ${filePath}`);
  } catch (error) {
    logger.error(`Failed to add changes: ${error}`);
  }
}

async function getChangedFiles() {
  try {
    const status = await repo.status();
    return [
      ...status.not_added,
      ...status.created,
      ...status.modified,
      ...status.renamed.map(file => file.to),
      ...status.deleted
    ];
  } catch (error) {
    logger.error(`Failed to get changed files: ${error}`);
    return [];
  }
}

async function getDiffForFiles(files) {
  try {
    const diffs = [];
    
    for (const file of files) {
      try {
        const diff = await repo.diff(['--', file]);
        const stats = await repo.diffSummary(['--', file]);
        
        diffs.push({
          file,
          binary: !diff && stats.files.length > 0,
          insertions: stats.files[0]?.insertions || 0,
          deletions: stats.files[0]?.deletions || 0,
          diff
        });
      } catch (e) {
        // New file might not have a diff yet
        diffs.push({
          file,
          binary: false,
          insertions: 1,
          deletions: 0,
          diff: ''
        });
      }
    }
    
    return diffs;
  } catch (error) {
    logger.error(`Failed to get diffs: ${error}`);
    return [];
  }
}

async function commitChanges() {
  try {
    // Get the current status and changed files
    const changedFiles = await getChangedFiles();
    
    if (changedFiles.length === 0) {
      logger.info('No changes to commit');
      return false;
    }
    
    // Get diffs for auto-generating messages
    const diffs = await getDiffForFiles(changedFiles);
    
    // Generate a meaningful commit message
    let commitMessage;
    if (config.autoGenerateMessages) {
      const generatedMessage = generateCommitMessage(diffs);
      commitMessage = `${config.autoCommitPrefix} ${generatedMessage}`;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      commitMessage = `${config.autoCommitPrefix} ${config.commitMessage} [${timestamp}]`;
    }
    
    await repo.commit(commitMessage);
    logger.info(`Auto-saved changes with message: ${commitMessage}`);
    return true;
  } catch (error) {
    logger.error(`Failed to commit changes: ${error}`);
    return false;
  }
}

async function pushChanges() {
  if (!config.push) return;

  try {
    await repo.push(config.remote, config.branch);
    logger.info(`Pushed changes to ${config.remote}/${config.branch}`);
  } catch (error) {
    logger.error(`Failed to push changes: ${error}`);
  }
}

async function findAutoCommits() {
  try {
    const logs = await repo.log();
    const autoCommits = logs.all.filter(commit => 
      commit.message.startsWith(config.autoCommitPrefix)
    );
    return autoCommits;
  } catch (error) {
    logger.error(`Failed to retrieve git logs: ${error}`);
    return [];
  }
}

async function squashAutoCommits(finalCommitMessage) {
  try {
    // Validate the final commit message
    validateCommitMessage(finalCommitMessage);
    
    const autoCommits = await findAutoCommits();
    
    if (autoCommits.length === 0) {
      logger.info('No auto-commits found to squash');
      return false;
    }
    
    // Get the oldest auto-commit
    const oldestCommit = autoCommits[autoCommits.length - 1];
    
    // Soft reset to before the first auto-commit to unstage all changes
    await repo.reset(['--soft', `${oldestCommit.hash}^`]);
    
    // Commit all changes with the final message
    await repo.commit(finalCommitMessage);
    
    logger.info(`Squashed ${autoCommits.length} auto-commits into: "${finalCommitMessage}"`);
    return true;
  } catch (error) {
    logger.error(`Failed to squash commits: ${error}`);
    return false;
  }
}

module.exports = {
  addChanges,
  commitChanges,
  pushChanges,
  findAutoCommits,
  squashAutoCommits,
  getChangedFiles,
  getDiffForFiles
};