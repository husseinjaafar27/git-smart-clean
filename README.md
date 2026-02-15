# git-smart-clean

🧹 Smart cleanup tool for merged git branches

## Installation

```bash
npm install -g git-smart-clean
```

## Usage

### Basic Usage

```bash
# Interactive mode
git-smart-clean

# Preview without deleting
git-smart-clean --dry-run

# Exclude specific branches
git-smart-clean --exclude "main,develop,staging"

# Only branches older than X days
git-smart-clean --older-than 90
```

## Options

```bash
git-smart-clean [options]

Options:
  -V, --version              output the version number
  -d, --dry-run              Preview without deleting
  --older-than <days>        Only branches older than X days
  --exclude <branches>       Branches to exclude (default: "main,master,develop")
  -h, --help                 display help for command
```

## Features

✅ Interactive branch selection  
✅ Dry-run mode for safety  
✅ Shows branch age (committed X ago)  
✅ Color-coded by age (red/yellow/green)  
✅ Sorted by age (oldest first)  
✅ Auto-excludes protected branches  
✅ Beautiful terminal UI  
✅ Safe confirmation prompts  

## Examples

```bash
# Basic cleanup
git-smart-clean

# Preview first (recommended)
git-smart-clean --dry-run

# Only very old branches
git-smart-clean --older-than 180

# Exclude custom branches
git-smart-clean --exclude "main,staging,production,develop"

# Combine options
git-smart-clean --older-than 90 --exclude "main,dev" --dry-run
```

## How It Works

1. **Scans** for merged branches in your current repository
2. **Excludes** protected branches (main, master, develop, and current branch)
3. **Shows** branch age based on last commit date
4. **Color codes** by age:
   - 🔴 Red: Older than 3 months
   - 🟡 Yellow: 1-3 months old
   - 🟢 Green: Less than 1 month
5. **Lets you select** which branches to delete (all pre-selected)
6. **Confirms** before deleting
7. **Deletes** selected branches safely

## Screenshots

### Dry Run Mode
```
✔ Found 5 merged branches

🔍 DRY RUN - No branches will be deleted

  • feature/old-authentication              (committed 2 months ago)
  • bugfix/payment-gateway-fix              (committed 3 weeks ago)
  • hotfix/urgent-security-patch            (committed 2 days ago)

Would delete 3 branches
```

### Interactive Mode
```
✔ Found 5 merged branches

? Select branches to delete (Space to select, Enter to confirm):
>(*) feature/old-authentication              (committed 2 months ago)
 (*) bugfix/payment-gateway-fix              (committed 3 weeks ago)
 ( ) hotfix/urgent-security-patch            (committed 2 days ago)
```

## Development

```bash
# Clone the repo
git clone https://github.com/husseinjaafar27/git-smart-clean.git
cd git-smart-clean

# Install dependencies
npm install

# Test locally
npm link
git-smart-clean --dry-run

# Run in another repo
cd ~/some-other-repo
git-smart-clean
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © husseinjaafar27

## Support

If you find this tool helpful, please ⭐ star the repo!

Found a bug? [Open an issue](https://github.com/husseinjaafar27/git-smart-clean/issues)
```