import * as vscode from 'vscode';

import { FlameCodeNavigator } from './flame-code-webpanel';
import { GarbadgeCollector } from './gc';

let gc?: GarbageCollector;

export function activate(context: vscode.ExtensionContext) {

   console.log('Congratulations, your extension "lab-seven-codeflame" is now active!');
   gc = new GarbageCollector();

   const cmdCodeFlameShow = vscode.commands.registerCommand('codeflame.show', () => {
      vscode.window.showInformationMessage(`open ${context.extensionUri}`);
      FlameCodeNavigator.createOrShow(context.extensionUri);
   });
   gc.record(context, cmdCodeFlameShow, 'cmd:codeflame.show');
}

export function deactivate() {
   if (gc) gc.dispose();
   gc = undefined;
}
