import * as vscode from 'vscode';

export class FlameCodeNavigator implements vscode.WebviewViewProvider {
   private _view?: vscode.WebviewView;

   constructor(
      private readonly _extensionUri: vscode.Uri,
   ) {
   }

   public resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken,
   ) {
      this._view = webviewView;
      webviewView.webview.options = {
         enableScripts: true,
         localResourceRoots: [this._extensionUri]
      };
      this._updateContent();
      vscode.window.onDidChangeActiveTextEditor(() => {
         this._updateContent();
      });
      vscode.workspace.onDidChangeTextDocument(evt => {
         if (evt.document === vscode.window.activeTextEditor?.document) {
            this._updateContent();
         }
      });
   }

   private _updateContent() {
      if (!this._view) return;
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
         this._view.webview.html = this._getHtml('No active editor');
         return;
      }
      const text = editor.document.getText();
      this._view.webview.html = this._getHtml(text);

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
