/**
 * Validates and formats conventional commit messages
 */

const COMMIT_TYPES = ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'revert'];

function validateCommitMessage(message) {
  const pattern = /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\([\w-]+\):\s.+$/;
  
  if (!pattern.test(message)) {
    throw new Error(
      'Invalid commit message format. Please use: type(product-name): title of changes\n' +
      `Valid types: ${COMMIT_TYPES.join(', ')}`
    );
  }
  
  return true;
}

function formatCommitMessage(type, product, title) {
  if (!COMMIT_TYPES.includes(type)) {
    throw new Error(`Invalid commit type. Valid types: ${COMMIT_TYPES.join(', ')}`);
  }
  
  if (!product || !title) {
    throw new Error('Product name and title are required');
  }
  
  return `${type}(${product}): ${title}`;
}

module.exports = {
  validateCommitMessage,
  formatCommitMessage,
  COMMIT_TYPES
};