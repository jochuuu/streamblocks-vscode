#!/bin/bash

EXT_PATH="/repo/streamblocks/streamblocks-vscode"
TEST_PROJECT="$(pwd)"

# Launch VS Code with the extension and open the CAL file
echo "Launching VS Code with CAL extension..."
code "$TEST_FILE" --extensionDevelopmentPath="$EXT_PATH"
