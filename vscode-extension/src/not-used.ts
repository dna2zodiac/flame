/*
- Add a status bar item to quickly toggle the preview:

const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
statusBarItem.text = "$(preview) Flame";
statusBarItem.command = 'codeflame.show';
statusBarItem.show();
context.subscriptions.push(statusBarItem);


- Add keyboard shortcut in package.json:

"contributes": {
    "keybindings": [
        {
            "command": "code-preview.showPreview",
            "key": "ctrl+k v",
            "mac": "cmd+k v"
        }
    ]
}


- Add panel state persistence:

// Save panel state
context.workspaceState.update('codePreviewVisible', true);
// Restore panel state on startup
if (context.workspaceState.get('codePreviewVisible')) {
    vscode.commands.executeCommand('code-preview.showPreview');
}
*/
