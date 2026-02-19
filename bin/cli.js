#!/usr/bin/env node

import { program } from 'commander';
import { cleanBranches } from '../src/index.js';

program
    .name('git-smart-clean')
    .description('Smart cleanup tool for merged git branches')
    .version('1.1.0')
    .option('-d, --dry-run', 'Preview without deleting')
    .option('--older-than <days>', 'Only branches older than X days', parseInt)
    .option('--exclude <branches>', 'Branches to exclude (comma-separated)', 'main,master,develop')
    .action(async (options) => {
        try {
            await cleanBranches(options);
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program.parse();