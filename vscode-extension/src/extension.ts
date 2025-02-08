import * as vscode from 'vscode';

import { FlameCodeNavigator } from './flame-code-webpanel';

export function activate(context: vscode.ExtensionContext) {

   console.log('Congratulations, your extension "lab-seven-codeflame" is now active!');

   const disposable = vscode.commands.registerCommand('codeflame.show', () => {
      vscode.window.showInformationMessage(`open ${context.extensionUri}`);
      FlameCodeNavigator.createOrShow(context.extensionUri);
   });

   context.subscriptions.push(disposable);
}

export function deactivate() {}
