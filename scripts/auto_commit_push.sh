#!/usr/bin/env bash
# auto_commit_push.sh
# Stages all changes in the Doppio project, commits with a timestamped message,
# and pushes to GitHub. Runs every 30 minutes via launchd.
# Skips silently if there is nothing to commit.

set -euo pipefail

PROJECT_DIR="/Users/renatosgafilho/Projects/KOOKY/Doppio"
LOG_FILE="$PROJECT_DIR/scripts/auto_commit_push.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

cd "$PROJECT_DIR"

# Bail out if not a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  log "ERROR: Not a git repository. Skipping."
  exit 1
fi

# Stage all changes (respects .gitignore)
git add -A

# Check if there is anything to commit
if git diff --cached --quiet; then
  log "Nothing to commit. Skipping."
  exit 0
fi

# Build commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
CHANGED_FILES=$(git diff --cached --name-only | head -10 | tr '\n' ', ' | sed 's/,$//')
FILE_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')

if [[ "$FILE_COUNT" -gt 10 ]]; then
  CHANGED_FILES="$CHANGED_FILES ... (+$((FILE_COUNT - 10)) more)"
fi

COMMIT_MSG="auto: checkpoint $TIMESTAMP

Files: $CHANGED_FILES"

# Commit
git commit -m "$COMMIT_MSG"
log "Committed: $COMMIT_MSG"

# Push
if git push origin main >> "$LOG_FILE" 2>&1; then
  log "Pushed to origin/main successfully."
else
  log "WARNING: Push failed. Changes are committed locally. Will retry next run."
fi
