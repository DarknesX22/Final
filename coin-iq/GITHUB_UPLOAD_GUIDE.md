# GitHub Upload Guide for Coin-IQ Project

This guide will walk you through the process of uploading your Coin-IQ project to GitHub.

## Prerequisites

1. **GitHub Account**: Make sure you have a GitHub account at https://github.com
2. **Git Installed**: Ensure Git is installed on your system
3. **Project Ready**: Your project is complete and tested locally

## Steps to Upload to GitHub

### 1. Prepare Your Project

First, ensure you have removed any sensitive information:

- Make sure your `.env.local` file is properly ignored in `.gitignore`
- Verify no API keys or passwords are hardcoded in your source code
- Ensure your `.gitignore` includes:
  ```
  .env*
  node_modules/
  .next/
  out/
  build/
  *.log
  ```

### 2. Initialize Git Repository

Open your terminal/command prompt in the project directory and run:

```bash
# Navigate to your project directory
cd d:\FYPFinal\coin-iq

# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Coin-IQ cryptocurrency prediction platform"
```

### 3. Create GitHub Repository

1. Go to https://github.com and log in to your account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Give your repository a name (e.g., "coin-iq" or "cryptocurrency-prediction-platform")
4. Add a description: "A modern cryptocurrency prediction and analysis platform built with Next.js, Tailwind CSS, and Framer Motion"
5. Select "Public" (or "Private" if you prefer)
6. **Important**: Do NOT initialize with README, .gitignore, or license (you already have these)
7. Click "Create repository"

### 4. Link and Push to GitHub

After creating the repository, GitHub will show you instructions. Follow these commands:

```bash
# Add remote origin (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Verify the remote URL
git remote -v

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### 5. Verification

Visit your GitHub repository URL to confirm all files have been uploaded successfully.

## Post-Upload Steps

### 1. Update Repository Settings

1. Go to your repository on GitHub
2. Click "Settings" tab
3. In the "General" section, scroll down to "Visibility":
   - Confirm it's set to Public or Private as desired
4. In "Features", enable:
   - Wikis (optional)
   - Issues (recommended)
   - Projects (optional)
   - Downloads (recommended)

### 2. Add a License (Recommended)

If you want to make your project open-source, add a license:

1. In your repository, click "Add file" > "Create new file"
2. Name it `LICENSE`
3. Add your chosen license text (e.g., MIT, Apache 2.0, etc.)
4. Commit the file

### 3. Configure GitHub Pages (Optional)

If you want to host a demo:

1. Go to repository "Settings"
2. Scroll to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/root" folder
5. Save

## GitHub-Specific Features

### GitHub Actions (CI/CD - Optional)

Create `.github/workflows/nextjs.yml` for automated testing and deployment:

```yaml
# Sample workflow for Next.js
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Build project
      run: npm run build
```

### GitHub Issues Template

Create `.github/ISSUE_TEMPLATE/` folder with templates:
- `bug_report.md`
- `feature_request.md`

### Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
Brief description of changes made

## Changes Made
- [ ] Feature implemented
- [ ] Bug fix
- [ ] Code improvement
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Additional tests performed
```

## Security Considerations

⚠️ **Important Security Notes**:

1. **Never commit environment files**: Your `.env.local` should remain in `.gitignore`
2. **API Keys**: Double-check that no API keys are in your code
3. **Database credentials**: Ensure database URLs and credentials are not hardcoded
4. **Secrets**: Store secrets in GitHub Secrets if using GitHub Actions

## Repository Maintenance Tips

1. **Regular commits**: Make frequent, descriptive commits
2. **Branching strategy**: Use feature branches for development
3. **Pull requests**: Use PRs for code review
4. **Documentation**: Keep README updated
5. **Issues**: Use GitHub Issues for tracking bugs/features

## Sharing Your Project

Once uploaded:

1. Share the GitHub link in your portfolio
2. Include it in your resume/CV
3. Add the GitHub URL to your LinkedIn profile
4. Consider creating a demo video showcasing the project
5. Add screenshots to your README

## Troubleshooting Common Issues

### Issue: Large files causing push to fail
**Solution**: Use Git LFS for large files or remove unnecessary large files

### Issue: Accidentally committed sensitive data
**Solution**: Use `git filter-branch` or BFG Repo-Cleaner to remove sensitive files from history

### Issue: Push rejected
**Solution**: 
```bash
git pull origin main --rebase
git push origin main
```

---

Your project is now ready to be uploaded to GitHub! Follow the steps above to share your Coin-IQ cryptocurrency prediction platform with the world.