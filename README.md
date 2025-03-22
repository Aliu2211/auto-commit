
# Auto Commit Library

This library automatically tracks and commits changes in your Git repository as temporary work-in-progress commits. When you're ready, you can squash these commits into a single meaningful conventional commit.

## Features

- **Automatic repository detection** - No need to specify your repo path
- **Smart commit messages** - Automatically generates commit messages based on the changes
- **Conventional commit format** - Enforces industry-standard commit formatting
- **Temporary auto-commits** - Saves work frequently with WIP commits
- **Squash functionality** - Combines WIP commits into a single meaningful commit

## Installation

```bash
npm install auto-commit-library
```

## Configuration

Create a `.env` file in your project root with the following options:

```
# Auto-detection of repo path is enabled by default
# REPO_PATH=<path-to-your-repo>
COMMIT_MESSAGE=Auto-saved changes
PUSH=false
REMOTE=origin
BRANCH=main
AUTO_COMMIT_PREFIX=WIP:
SQUASH_ON_EXIT=false
PRODUCT_NAME=your-product
```

## Usage

### As a CLI tool

```bash
# Start watching files for auto-commits
npx auto-commit start

# When ready to create a proper commit, squash all WIP commits
npx auto-commit squash
```

### As a library

```javascript
const autoCommit = require('auto-commit-library');

// Start watching files for changes
autoCommit.start();

// Later, squash commits programmatically
const finalMessage = 'feat(my-product): add awesome feature';
autoCommit.gitUtils.squashAutoCommits(finalMessage)
  .then(success => {
    if (success) {
      console.log('Successfully squashed commits');
    }
  });
```

## How it works

1. The library monitors file changes in your Git repository
2. When changes are detected, it:
   - Analyzes what files were changed
   - Determines what type of changes were made (code, tests, docs, etc.)
   - Generates a meaningful commit message based on the changes
   - Creates a temporary WIP commit
3. When you're ready to create a proper commit:
   - Squashes all WIP commits into a single commit
   - Applies proper conventional commit formatting 

## Commit Message Format

When squashing commits, the library enforces the conventional commit format:

```
type(product-name): title of changes
```

Valid types include: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert

Examples:
- `feat(user-auth): add biometric login`
- `fix(payment): resolve duplicate transaction issue`
- `chore(deps): update dependencies`

