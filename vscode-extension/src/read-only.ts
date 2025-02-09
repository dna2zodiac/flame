import * as vscode from 'vscode';
import { GarbageCollector } from './gc';

const CMD_READONLY_SWITCH = 'codeflame.readonly.switch';

export class ReadOnlyMode {
   private static _instance?: ReadOnlyMode;
   private _status?: vscode.StatusBarItem;
   private _readOnly: boolean = false;

   public static init(context: vscode.ExtensionContext, gc: GarbageCollector) {
      if (!ReadOnlyMode._instance) {
         ReadOnlyMode._instance = new ReadOnlyMode(context, gc);
      }
      return ReadOnlyMode._instance;
   }

   private constructor(context: vscode.ExtensionContext, gc: GarbageCollector) {
      console.log(`[codeflame:I] init readonly mode module ...`);
      const cmdSwitchReadOnlyMode = vscode.commands.registerCommand(CMD_READONLY_SWITCH, () => {
         this._readOnly = !this._readOnly;
         this._updateStatus();
      });
      gc.record(context, cmdSwitchReadOnlyMode, `cmd:${CMD_READONLY_SWITCH}`);

      const cmdType = vscode.commands.registerCommand('type', args => {
         if (this._readOnly) return;
         vscode.commands.executeCommand('default:type', { text: args.text });
      });
      gc.record(context, cmdType, 'cmd:type');

      const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      status.command = CMD_READONLY_SWITCH;
      this._status = status;
      this._updateStatus();
      gc.record(context, status, 'status:readonly');
   }

   private _updateStatus() {
      if (!this._status) return;
      this._status.text = this._readOnly ? 'o' : 'x';
      this._status.tooltip = this._readOnly ? 'Flame ReadOnly: On' : 'Flame ReadOnly: Off';
      this._status.show();
   }
}
