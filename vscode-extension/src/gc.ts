import * as vscode from 'vscode';

class GarbageCollector {
   private _disposables: { [key: string]: any; } = {};

   constructor() {
   }

   get(name: string) {
      return this._disposables[name];
   }

   record(context: vscode.ExtensionContext, disposable: any, name: string) {
      context.subscriptions.push(disposable);
      this._disposables[name] = disposable;
   }

   dispose() {
      const ks = Object.keys(this._disposables);
      ks.forEach(k => {
         const z = this._disposables[k];
         if (!z || !z.dispose) return;
         z.dispose();
      });
      ks.forEach(k => {
         delete this._disposables[k];
      });
   }
}
