import * as vscode from 'vscode';

const VIEW_COLUMN = vscode.ViewColumn.Two;

export class FlameCodeNavigator {
   private static _currentPanel?: FlameCodeNavigator;
   private readonly _panel: vscode.WebviewPanel;
   private readonly _extensionUri: vscode.Uri;
   private _disposables: vscode.Disposable[] = [];
   private _dataReady: boolean = false;

   public static createOrShow(extensionUri: vscode.Uri) {
      if (FlameCodeNavigator._currentPanel) {
         FlameCodeNavigator._currentPanel._panel.reveal(VIEW_COLUMN);
         return;
      }
      const panel = vscode.window.createWebviewPanel(
         'flameCodeNavigatorWebviewPanel',
         'Flame Code Navigator',
         VIEW_COLUMN,
         { enableScripts: true }
      );
      FlameCodeNavigator._currentPanel = new FlameCodeNavigator(panel, extensionUri);
   }

   private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
      this._panel = panel;
      this._extensionUri = extensionUri;
      this._update();
      this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
      this._panel.onDidChangeViewState(evt => {
         if (this.isReady()) this._update();
      }, null, this._disposables);
      vscode.window.onDidChangeActiveTextEditor(() => {
         if (this.isReady()) this._update();
      }, null, this._disposables);
      vscode.workspace.onDidChangeTextDocument(evt => {
         if (this.isReady() && evt.document === vscode.window.activeTextEditor?.document) {
            this._update();
         }
      }, null, this._disposables);
   }

   public isReady() {
      if (!this._panel) return false;
      return !!this._panel.visible;
   }

   public dispose() {
      FlameCodeNavigator._currentPanel = undefined;
      this._dataReady = false;
      this._panel.dispose();
      while (this._disposables.length) {
         const z = this._disposables.pop();
         if (z) z.dispose();
      }
   }

   private _update() {
      if (!this._panel) return;
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
         if (!this._dataReady) {
            this._panel.webview.html = this._getHtml('No active editor');
         }
         return;
      }
      const text = editor.document.getText();
      this._panel.webview.html = this._getHtml(text);
      this._dataReady = true;
   }

   private _getHtml(content: string): string {
      return `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <title>Flame Code Navigator</title>
   <style>
   body {
       padding: 10px;
       word-wrap: break-word;
       white-space: pre-wrap;
       font-family: monospace;
   }
   </style>
</head>
<body>
${this._escapeHtml(content)}
</body>
      `;
   }

   private _escapeHtml(text: string): string {
      return text
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
   }
}
