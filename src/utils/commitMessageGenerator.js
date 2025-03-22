const path = require('path');

/**
 * File type categorization for smarter commit messages
 */
const FILE_CATEGORIES = {
  js: { extensions: ['.js', '.jsx', '.ts', '.tsx'], type: 'code' },
  css: { extensions: ['.css', '.scss', '.less', '.sass'], type: 'style' },
  docs: { extensions: ['.md', '.txt', '.doc', '.docx'], type: 'docs' },
  test: { extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts'], type: 'test' },
  config: { extensions: ['.json', '.yml', '.yaml', '.config.js', '.env'], type: 'config' }
};

/**
 * Determines the file category based on its path and extension
 * @param {string} filePath Path to the file
 * @returns {string} Category of the file
 */
function categorizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();
  
  // Check if it's a test file by name pattern
  if (fileName.includes('.test.') || fileName.includes('.spec.')) {
    return 'test';
  }
  
  // Check for documentation
  if (fileName.includes('readme') || fileName.includes('documentation')) {
    return 'docs';
  }
  
  // Check by directory structure
  if (filePath.includes('/test/') || filePath.includes('\\test\\') || 
      filePath.includes('/__tests__/') || filePath.includes('\\__tests__\\')) {
    return 'test';
  }
  
  if (filePath.includes('/docs/') || filePath.includes('\\docs\\')) {
    return 'docs';
  }
  
  // Check by extension
  for (const [category, data] of Object.entries(FILE_CATEGORIES)) {
    if (data.extensions.some(extension => filePath.endsWith(extension))) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Determines a conventional commit type based on file categories
 * @param {Object} stats Statistics about changed files
 * @returns {string} Conventional commit type
 */
function determineCommitType(stats) {
  const { code, style, test, docs, config } = stats;
  
  // Prioritize the types
  if (code > 0 && stats.added > stats.modified) {
    return 'feat';
  } else if (code > 0) {
    return 'fix';
  } else if (test > 0) {
    return 'test';
  } else if (style > 0) {
    return 'style';
  } else if (docs > 0) {
    return 'docs';
  } else if (config > 0) {
    return 'chore';
  }
  
  return 'chore';
}

/**
 * Analyzes a list of changed files to determine their component
 * @param {Array<string>} changedFiles List of changed files
 * @returns {string} Common component or directory
 */
function findCommonComponent(changedFiles) {
  if (changedFiles.length === 0) {
    return 'general';
  }
  
  if (changedFiles.length === 1) {
    const file = changedFiles[0];
    const dirname = path.dirname(file);
    const component = dirname.split(/[\\/]/).filter(Boolean).pop();
    return component || path.basename(file, path.extname(file)) || 'general';
  }
  
  // Find common directory
  const dirs = changedFiles.map(file => path.dirname(file).split(/[\\/]/));
  const commonSegments = [];
  
  for (let i = 0; i < Math.min(...dirs.map(d => d.length)); i++) {
    const segment = dirs[0][i];
    if (dirs.every(d => d[i] === segment)) {
      commonSegments.push(segment);
    } else {
      break;
    }
  }
  
  const lastCommon = commonSegments.filter(Boolean).pop();
  return lastCommon || 'general';
}

/**
 * Creates a commit message description based on changed files
 * @param {Object} stats Statistics about changed files
 * @param {Array<string>} changedFiles List of changed files
 * @returns {string} Commit message description
 */
function createCommitDescription(stats, changedFiles) {
  if (stats.added > 0 && stats.modified === 0 && stats.deleted === 0) {
    return `add ${stats.added} new file${stats.added > 1 ? 's' : ''}`;
  } else if (stats.modified > 0 && stats.added === 0 && stats.deleted === 0) {
    return `update ${stats.modified} file${stats.modified > 1 ? 's' : ''}`;
  } else if (stats.deleted > 0 && stats.added === 0 && stats.modified === 0) {
    return `remove ${stats.deleted} file${stats.deleted > 1 ? 's' : ''}`;
  } else {
    return `modify ${changedFiles.length} files (${stats.added} added, ${stats.modified} updated, ${stats.deleted} deleted)`;
  }
}

/**
 * Generates a commit message based on the changed files
 * @param {Array<Object>} diffs Git diff information
 * @returns {string} Generated commit message following conventional commit format
 */
function generateCommitMessage(diffs) {
  if (!diffs || diffs.length === 0) {
    return 'chore: update files';
  }
  
  const changedFiles = diffs.map(diff => diff.file);
  
  // Collect statistics about the changes
  const stats = {
    added: 0,
    modified: 0,
    deleted: 0,
    code: 0,
    style: 0,
    test: 0,
    docs: 0,
    config: 0,
    other: 0
  };
  
  diffs.forEach(diff => {
    const category = categorizeFile(diff.file);
    stats[category] = (stats[category] || 0) + 1;
    
    if (diff.binary) {
      stats.modified++;
      return;
    }
    
    // Count lines changed
    if (diff.insertions > 0 && diff.deletions === 0) {
      stats.added++;
    } else if (diff.deletions > 0 && diff.insertions === 0) {
      stats.deleted++;
    } else {
      stats.modified++;
    }
  });
  
  const commitType = determineCommitType(stats);
  const component = findCommonComponent(changedFiles);
  const description = createCommitDescription(stats, changedFiles);
  
  return `${commitType}(${component}): ${description}`;
}

module.exports = {
  generateCommitMessage,
  categorizeFile
};