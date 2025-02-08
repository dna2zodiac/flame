import * as vscode from 'vscode';

import { FlameCodeNavigator } from './flame-code';

export function activate(context: vscode.ExtensionContext) {

   console.log('Congratulations, your extension "lab-seven-codeflame" is now active!');
   const provider = new FlameCodeNavigator(context.extensionUri);
   const providerRegistration = vscode.window.registerWebviewViewProvider(
      'code-flame-navigator', provider
   );

   const disposable = vscode.commands.registerCommand('codeflame.show', () => {
      vscode.window.showInformationMessage('Hello World from code-flame!');
      vscode.commands.executeCommand('code-flame-navigator.focus');
   });

   context.subscriptions.push(disposable);
}

export function deactivate() {}
