import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

// Helper function to format relative time
function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
        return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    } else if (diffMonths > 0) {
        return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else if (diffWeeks > 0) {
        return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
        return 'just now';
    }
}

// Color code based on age
function getAgeColor(date) {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
        return chalk.red;      // Red: older than 3 months
    } else if (diffDays > 30) {
        return chalk.yellow;   // Yellow: 1-3 months
    } else {
        return chalk.green;    // Green: less than 1 month
    }
}

export async function cleanBranches(options) {
    const spinner = ora('Scanning branches...').start();
    const git = simpleGit();

    try {
        // Check if we're in a git repository
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            spinner.fail('Not a git repository');
            process.exit(1);
        }

        // Get current branch
        const status = await git.status();
        const currentBranch = status.current;

        // Get merged branches
        const branchSummary = await git.branch(['--merged']);

        // Parse exclude list
        const excludeBranches = options.exclude.split(',').map(b => b.trim());
        excludeBranches.push(currentBranch);

        // Filter branches
        let mergedBranches = branchSummary.all.filter(branch => {
            const cleanBranch = branch.replace('remotes/origin/', '').trim();
            return !excludeBranches.includes(cleanBranch);
        });

        if (mergedBranches.length === 0) {
            spinner.succeed('No merged branches to clean up!');
            return;
        }

        // Get last commit date for each branch
        spinner.text = 'Getting branch information...';

        const branchesWithInfo = await Promise.all(
            mergedBranches.map(async (branch) => {
                try {
                    const log = await git.log([branch, '-1']);
                    const lastCommitDate = log.latest ? new Date(log.latest.date) : new Date();
                    const relativeTime = getRelativeTime(lastCommitDate);

                    return {
                        name: branch,
                        date: lastCommitDate,
                        relativeTime: `committed ${relativeTime}`
                    };
                } catch (error) {
                    return {
                        name: branch,
                        date: new Date(),
                        relativeTime: 'unknown'
                    };
                }
            })
        );

        // Sort by date (oldest first)
        branchesWithInfo.sort((a, b) => a.date - b.date);

        // Filter by age if --older-than is specified
        if (options.olderThan) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - options.olderThan);

            const originalCount = branchesWithInfo.length;
            branchesWithInfo.splice(0, branchesWithInfo.length,
                ...branchesWithInfo.filter(b => b.date < cutoffDate)
            );

            const filteredCount = originalCount - branchesWithInfo.length;

            if (filteredCount > 0) {
                console.log(chalk.gray(`\nFiltered out ${filteredCount} branch(es) newer than ${options.olderThan} days\n`));
            }
        }

        // Check if any branches remain after filtering
        if (branchesWithInfo.length === 0) {
            if (options.olderThan) {
                spinner.succeed(`No merged branches older than ${options.olderThan} days!`);
            } else {
                spinner.succeed('No merged branches to clean up!');
            }
            return;
        }

        spinner.succeed(`Found ${chalk.bold(branchesWithInfo.length)} merged branches${options.olderThan ? ` older than ${options.olderThan} days` : ''}`);

        // Dry run mode
        if (options.dryRun) {
            console.log(chalk.yellow('\n🔍 DRY RUN - No branches will be deleted\n'));

            branchesWithInfo.forEach(b => {
                const ageColor = getAgeColor(b.date);
                console.log(`  • ${chalk.gray(b.name.padEnd(40))} ${ageColor(`(${b.relativeTime})`)}`);
            });

            console.log(chalk.yellow(`\nWould delete ${branchesWithInfo.length} branches`));
            return;
        }

        // Interactive selection
        const { selectedBranches } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'selectedBranches',
            message: 'Select branches to delete (Space to select, Enter to confirm):',
            choices: branchesWithInfo.map(b => {
                const ageColor = getAgeColor(b.date);
                const displayName = `${b.name.padEnd(40)} ${ageColor(`(${b.relativeTime})`)}`;

                return {
                    name: displayName,
                    value: b.name,
                    checked: true
                };
            }),
            pageSize: 15
        }]);

        if (selectedBranches.length === 0) {
            console.log(chalk.yellow('No branches selected. Exiting.'));
            return;
        }

        // Confirm deletion
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Delete ${selectedBranches.length} branches?`,
            default: false
        }]);

        if (!confirm) {
            console.log(chalk.yellow('Cancelled. No branches deleted.'));
            return;
        }

        // Delete branches
        console.log('');
        const deleteSpinner = ora('Deleting branches...').start();

        for (const branch of selectedBranches) {
            try {
                await git.deleteLocalBranch(branch, true);
                console.log(chalk.green(`  ✓ Deleted ${branch}`));
            } catch (error) {
                console.log(chalk.red(`  ✗ Failed to delete ${branch}: ${error.message}`));
            }
        }

        deleteSpinner.succeed();
        console.log(chalk.bold.green(`\n✓ Successfully cleaned up ${selectedBranches.length} branches!\n`));

    } catch (error) {
        spinner.fail('Error occurred');
        throw error;
    }
}