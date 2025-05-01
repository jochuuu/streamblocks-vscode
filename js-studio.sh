#!/bin/bash

EXT_PATH_0="/repo/streamblocks/streamblocks-vscode"
EXT_PATH_1="/repo/streamblocks/streamblocks-compiler/streamblocks-compiler-0.0.1.vsix"
EXT_ID_1="streamblocks.streamblocks-compiler"  # Replace with actual ID
TEST_PROJECT="$(pwd)"

# Optionally: Find a CAL file in current directory to open
CAL_FILE=$(find "$TEST_PROJECT" -maxdepth 1 -name "*.cal" | head -n 1)

cleanup() {
    echo "Uninstalling temporary extension..."
    code --uninstall-extension "$EXT_ID_1" >/dev/null 2>&1
    echo "Cleanup done."
}

trap cleanup EXIT INT TERM

echo "Installing extension from $EXT_PATH_1..."
code --install-extension "$EXT_PATH_1" --force

echo "Launching VS Code in $TEST_PROJECT..."
if [[ -n "$CAL_FILE" ]]; then
    code "$TEST_PROJECT" "$CAL_FILE" --extensionDevelopmentPath="$EXT_PATH_0" &
else
    code "$TEST_PROJECT" --extensionDevelopmentPath="$EXT_PATH_0" &
fi

CODE_PID=$!
wait $CODE_PID
