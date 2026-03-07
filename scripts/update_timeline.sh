#!/usr/bin/env bash
# update_timeline.sh
# Scans the Doppio project for recently modified files and updates
# the Activity Log section in PROJECT_TIMELINE.md.
# Designed to run every 30 minutes via launchd.

set -euo pipefail

PROJECT_DIR="/Users/renatosgafilho/Projects/KOOKY/Doppio"
TIMELINE_FILE="$PROJECT_DIR/PROJECT_TIMELINE.md"
LOG_FILE="$PROJECT_DIR/scripts/update_timeline.log"
MARKER_START="<!-- AUTO-TIMELINE:START -->"
MARKER_END="<!-- AUTO-TIMELINE:END -->"

# Paths to exclude from activity scanning
EXCLUDE_PATTERNS=(
  ".git"
  ".obsidian/workspace.json"
  "scripts/update_timeline.log"
)

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

log "Running timeline update..."

# Build find exclude args
FIND_EXCLUDES=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  FIND_EXCLUDES+=(-not -path "*/$pattern*")
done

# Find files modified in the last 31 minutes (slight overlap to avoid gaps)
CHANGED_FILES=$(find "$PROJECT_DIR" \
  -type f \
  "${FIND_EXCLUDES[@]}" \
  -newer "$PROJECT_DIR/scripts/.last_run" \
  2>/dev/null | sort)

# Update the .last_run sentinel BEFORE processing so next run is accurate
touch "$PROJECT_DIR/scripts/.last_run"

if [[ -z "$CHANGED_FILES" ]]; then
  log "No changes detected. Skipping update."
  exit 0
fi

# Build the new activity block
NOW_DATE=$(date '+%B %-d, %Y')
NOW_TIME=$(date '+%H:%M')

NEW_BLOCK="### $NOW_DATE — $NOW_TIME update\n\n"
NEW_BLOCK+="| Time | File | Event |\n"
NEW_BLOCK+="|------|------|-------|\n"

while IFS= read -r filepath; do
  # Get modification time
  MOD_TIME=$(stat -f '%Sm' -t '%H:%M' "$filepath" 2>/dev/null || echo "??:??")
  # Make path relative to project root
  REL_PATH="${filepath#$PROJECT_DIR/}"
  # Determine event type
  if git -C "$PROJECT_DIR" ls-files --error-unmatch "$filepath" &>/dev/null 2>&1; then
    EVENT="Modified"
  else
    EVENT="New file"
  fi
  NEW_BLOCK+="| **$MOD_TIME** | \`$REL_PATH\` | $EVENT |\n"
done <<< "$CHANGED_FILES"

# Read current timeline content
CONTENT=$(cat "$TIMELINE_FILE")

# Extract content before and after the markers
BEFORE=$(echo "$CONTENT" | sed -n "/$MARKER_START/!{p;/$MARKER_START/q};")
BEFORE=$(echo "$CONTENT" | awk "/$MARKER_START/{found=1} !found{print}")
AFTER=$(echo "$CONTENT" | awk "found && /$MARKER_END/{found=0; next} /$MARKER_END/{found=1; next} found{print}")

# Rebuild: everything before marker + new block + everything after marker
{
  echo "$BEFORE"
  echo "$MARKER_START"
  printf "%b\n" "$NEW_BLOCK"
  # Preserve prior entries (everything that was inside the markers before)
  PRIOR=$(echo "$CONTENT" | awk "/$MARKER_START/{inside=1; next} /$MARKER_END/{inside=0} inside{print}")
  if [[ -n "$PRIOR" && "$PRIOR" != *"No activity logged yet"* ]]; then
    echo ""
    echo "---"
    echo ""
    echo "$PRIOR"
  fi
  echo "$MARKER_END"
} > "$TIMELINE_FILE.tmp"

# Also grab everything after the end marker from original
AFTER_MARKER=$(echo "$CONTENT" | awk "/$MARKER_END/{found=1; next} found{print}")
if [[ -n "$AFTER_MARKER" ]]; then
  echo "$AFTER_MARKER" >> "$TIMELINE_FILE.tmp"
fi

mv "$TIMELINE_FILE.tmp" "$TIMELINE_FILE"

FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
log "Updated timeline with $FILE_COUNT changed file(s)."
