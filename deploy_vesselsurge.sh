#!/bin/bash

# Script to automate the Git push and Vercel deployment for VesselSurge.
# NOTE: This script requires the environment to have the venv/npm/git/vercel CLIs
# and requires the .env.local file to contain necessary secrets if running locally.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="${OPENCLAW_REPO_PATH:-$SCRIPT_DIR}"
OPENCLAW_PATH="/Users/cherif/.openclaw/workspace/v0-vesselsurge"
REPO_NAME="v0-vesselsurge"

if [ -d "$OPENCLAW_PATH" ]; then
    REPO_PATH="$OPENCLAW_PATH"
fi

echo "Starting automated deployment for $REPO_NAME..."

# 1. Navigate to the repository directory
if [ ! -d "$REPO_PATH" ]; then
    echo "ERROR: Repository directory not found at $REPO_PATH"
    exit 1
fi
cd "$REPO_PATH"

# 2. Pull latest changes (safety step)
echo "Pulling latest changes from remote..."
# We use '|| true' to prevent the script from exiting on a simple warning
git pull origin main || git pull origin master || true

# 3. Stage all changes
echo "Staging all changes..."
git add .

# Check if there are any staged changes
if git diff --cached --exit-code; then
    echo "No file changes detected to commit. Skipping commit and push."
else
    # 4. Commit changes
    COMMIT_MESSAGE="Automated OpenClaw deployment trigger at $(date)"
    echo "Committing changes with message: $COMMIT_MESSAGE"
    git commit -m "$COMMIT_MESSAGE"

    # 5. Push changes to GitHub
    echo "Pushing changes to GitHub..."
    git push origin main || git push origin master

    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to push to GitHub. Aborting deployment."
        exit 1
    fi
fi

# 6. Deploy using Vercel CLI
echo "--- Deployment Triggered: Calling Vercel CLI ---"
# This command assumes VERCEL_TOKEN and VERCEL_ORG_ID are available in the environment.
vercel deploy --prod --yes
if [ $? -ne 0 ]; then
    echo "ERROR: Vercel deployment failed. Check Vercel CLI authentication and project name."
    exit 1
else
    echo "✅ DEPLOYMENT SUCCESSFUL: VesselSurge deployed successfully to Vercel."
fi
