#!/usr/bin/env bash
#
# One-shot deploy to GitHub Pages.
# Requires the GitHub CLI: https://cli.github.com  (macOS: brew install gh)
#
# Usage:
#   ./deploy.sh <repo-name>
# Example:
#   ./deploy.sh work-time-tracker
#
set -euo pipefail

REPO="${1:-work-time-tracker}"

# 1. Make sure you're logged in to GitHub (opens a browser the first time)
if ! gh auth status >/dev/null 2>&1; then
  echo "Logging in to GitHub..."
  gh auth login
fi

USER="$(gh api user --jq .login)"
echo "GitHub user: $USER  ->  repo: $REPO"

# 2. Init git (safe to re-run)
git init -q
git add .
git commit -qm "Work time tracker" || echo "Nothing new to commit."
git branch -M main

# 3. Create the repo on GitHub (public) and push.
#    If it already exists, just add the remote and push.
if gh repo view "$USER/$REPO" >/dev/null 2>&1; then
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$USER/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" --public --source=. --remote=origin --push
fi

# 4. Enable GitHub Pages via GitHub Actions
gh api -X POST "repos/$USER/$REPO/pages" \
  -f "build_type=workflow" >/dev/null 2>&1 || \
gh api -X PUT "repos/$USER/$REPO/pages" \
  -f "build_type=workflow" >/dev/null 2>&1 || true

echo ""
echo "Done. The GitHub Actions build is now running."
echo "Watch it:   https://github.com/$USER/$REPO/actions"
echo "Live site:  https://$USER.github.io/$REPO/"
echo "(first build takes ~1-2 minutes)"
