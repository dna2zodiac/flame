import * as vscode from 'vscode';

import { FlameCodeNavigator } from './flame-code-webpanel';
import { GarbageCollector } from './gc';
import { ReadOnlyMode } from './read-only';

let gc: GarbageCollector | undefined;

export function activate(context: vscode.ExtensionContext) {

   console.log(`[codeflame:I] init codeflame core module ...`);
   gc = new GarbageCollector();

   const cmdCodeFlameShow = vscode.commands.registerCommand('codeflame.show', () => {
      vscode.window.showInformationMessage(`open ${context.extensionUri}`);
      FlameCodeNavigator.createOrShow(context.extensionUri);
   });
   gc.record(context, cmdCodeFlameShow, 'cmd:codeflame.show');

   const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
   statusBarItem.text = "$(preview) Flame";
   statusBarItem.tooltip = new vscode.MarkdownString(`**Show** Flame Code Navigator`);
   statusBarItem.command = 'codeflame.show';
   statusBarItem.show();
   gc.record(context, statusBarItem, 'status:item');

   ReadOnlyMode.init(context, gc);
}

export function deactivate() {
   console.log(`[codeflame:I] deactivate codeflame extension ...`);
   if (gc) gc.dispose();
   gc = undefined;
}
