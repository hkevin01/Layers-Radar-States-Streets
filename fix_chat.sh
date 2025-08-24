#!/bin/bash

# Function to log messages
log() {
  echo "[INFO] $1"
}

# Function to log errors
error() {
  echo "[ERROR] $1"
}

# Paths and variables
GLOBAL_CONFIG="$HOME/.config/Code/User/settings.json"
WORKSPACE_CONFIG="./.vscode/settings.json"
WORKSPACE_FILE="$(find . -name '*.code-workspace' 2>/dev/null)"
LAUNCH_CONFIG="./.vscode/launch.json"
ENV_FILE="./.env"
STATE_STORAGE_DIR="$HOME/.config/Code/User/workspaceStorage"
LOG_FILE="./copilot_project_debug_log.txt"

# Start logging
log "Starting debug process for project-specific Copilot Chat issues..." > "$LOG_FILE"

# Step 1: Log project details
log "Logging project details..."
echo "Project Path: $(pwd)" >> "$LOG_FILE"
echo "Environment Details:" >> "$LOG_FILE"
echo "OS: $(uname -a)" >> "$LOG_FILE"
echo "VS Code Version: $(code --version | head -n 1)" >> "$LOG_FILE"
echo "Node.js Version: $(node -v 2>/dev/null || echo 'Not Installed')" >> "$LOG_FILE"

# Step 2: Check and modify .vscode/settings.json
if [[ -f "$WORKSPACE_CONFIG" ]]; then
  log "Checking and cleaning .vscode/settings.json..."
  log "Backing up .vscode/settings.json to settings.json.bak..."
  cp "$WORKSPACE_CONFIG" "${WORKSPACE_CONFIG}.bak"
  log "Removing Copilot Chat-specific settings..."
  sed -i '/"github\.copilot-chat\..*":/d' "$WORKSPACE_CONFIG"
  echo "Cleaned .vscode/settings.json" >> "$LOG_FILE"
else
  log "No .vscode/settings.json found."
fi

# Step 3: Check and modify .code-workspace
if [[ -n "$WORKSPACE_FILE" ]]; then
  log "Checking and cleaning workspace file: $WORKSPACE_FILE..."
  log "Backing up $WORKSPACE_FILE to ${WORKSPACE_FILE}.bak..."
  cp "$WORKSPACE_FILE" "${WORKSPACE_FILE}.bak"
  log "Removing Copilot Chat-specific settings from workspace file..."
  sed -i '/"github\.copilot-chat\..*":/d' "$WORKSPACE_FILE"
  echo "Cleaned $WORKSPACE_FILE" >> "$LOG_FILE"
else
  log "No workspace file (*.code-workspace) found."
fi

# Step 4: Check and modify .vscode/launch.json
if [[ -f "$LAUNCH_CONFIG" ]]; then
  log "Checking .vscode/launch.json for potential overrides..."
  log "Backing up .vscode/launch.json to launch.json.bak..."
  cp "$LAUNCH_CONFIG" "${LAUNCH_CONFIG}.bak"
  # Log relevant entries for review
  echo "Entries in launch.json:" >> "$LOG_FILE"
  cat "$LAUNCH_CONFIG" >> "$LOG_FILE"
else
  log "No .vscode/launch.json found."
fi

# Step 5: Check for environment variables in .env files
if [[ -f "$ENV_FILE" ]]; then
  log "Checking for environment variables in .env file..."
  log "Backing up .env to .env.bak..."
  cp "$ENV_FILE" "${ENV_FILE}.bak"
  # Log relevant entries
  echo "Entries in .env file:" >> "$LOG_FILE"
  grep -i "GITHUB_COPILOT" "$ENV_FILE" >> "$LOG_FILE"
  # Remove problematic variables
  sed -i '/GITHUB_COPILOT_MODE/d' "$ENV_FILE"
  log "Removed GITHUB_COPILOT_MODE environment variable if found."
else
  log "No .env file found."
fi

# Step 6: Clear project-specific cache
log "Clearing project-specific cache from workspaceStorage..."
if [[ -d "$STATE_STORAGE_DIR" ]]; then
  PROJECT_HASH=$(echo -n "$(pwd)" | md5sum | awk '{print $1}')
  CACHE_DIR=$(find "$STATE_STORAGE_DIR" -type d -name "*$PROJECT_HASH*" 2>/dev/null)
  if [[ -n "$CACHE_DIR" ]]; then
    log "Found cache directory for project: $CACHE_DIR"
    rm -rf "$CACHE_DIR"
    log "Cache cleared."
  else
    log "No specific cache found for this project."
  fi
else
  log "workspaceStorage directory not found."
fi

# Step 7: Reinstall the Copilot Chat extension
log "Reinstalling Copilot Chat extension..."
code --uninstall-extension GitHub.copilot-chat >> "$LOG_FILE" 2>&1
rm -rf "$HOME/.vscode/extensions/github.copilot-chat-*"
code --install-extension GitHub.copilot-chat >> "$LOG_FILE" 2>&1

# Step 8: Log all installed extensions
log "Logging all installed extensions..."
code --list-extensions --show-versions >> "$LOG_FILE"

# Step 9: Restart extension host
log "Restarting the extension host..."
code --command "workbench.action.reloadWindow" >> "$LOG_FILE" 2>&1

# Step 10: Finalize log
log "Debugging process completed."
log "A detailed log has been saved to $LOG_FILE."
echo "========================================================"
echo "Manual Actions Required:"
echo "1. If the issue persists, review the log file: $LOG_FILE."
echo "2. Restart the extension host manually if needed (Ctrl+Shift+P -> Developer: Restart Extension Host)."
echo "========================================================"
