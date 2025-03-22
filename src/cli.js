const { program } = require('commander');
const inquirer = require('inquirer');
const { findAutoCommits, squashAutoCommits } = require('./utils/gitUtils');
const { COMMIT_TYPES, formatCommitMessage } = require('./utils/commitValidator');
const logger = require('./utils/logger');
const config = require('./config/config');

program
  .name('auto-commit')
  .description('Auto-commit library for saving work-in-progress changes')
  .version('1.0.0');

program
  .command('start')
  .description('Start watching files for changes')
  .action(() => {
    require('./index');
  });

program
  .command('squash')
  .description('Squash all auto-commits into a single conventional commit')
  .action(async () => {
    const autoCommits = await findAutoCommits();
    
    if (autoCommits.length === 0) {
      logger.info('No auto-commits found to squash.');
      return;
    }
    
    logger.info(`Found ${autoCommits.length} auto-commits to squash.`);
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of change:',
        choices: COMMIT_TYPES
      },
      {
        type: 'input',
        name: 'product',
        message: 'Enter the product/scope name:',
        default: config.productName,
        validate: input => input.trim() !== '' ? true : 'Product name is required'
      },
      {
        type: 'input',
        name: 'title',
        message: 'Enter a descriptive title for your changes:',
        validate: input => input.trim() !== '' ? true : 'Title is required'
      }
    ]);
    
    const finalMessage = formatCommitMessage(
      answers.type, 
      answers.product, 
      answers.title
    );
    
    const success = await squashAutoCommits(finalMessage);
    
    if (success) {
      logger.info('Successfully squashed commits with a conventional commit message.');
    } else {
      logger.error('Failed to squash commits.');
    }
  });

program.parse();

module.exports = program;