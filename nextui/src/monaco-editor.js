import * as monaco from 'monaco-editor';
import { local } from './services/db';
import eventbus from './services/eventbus';

function FlameTextModelService() {}
FlameTextModelService.prototype = {
   createModelReference: function (uri) {
      return this.getModel(uri);
   },
   registerTextModelContentProvider: function () {
      return { dispose: function () {} };
   },
   hasTextModelContentProvider: function (schema) {
      return true;
   },
   _buildReference: function (model) {
      var lifecycle = require('vs/base/common/lifecycle');
      var ref = new lifecycle.ImmortalReference({ textEditorModel: model });
      return {
         object: ref.object,
         dispose: function () { ref.dispose(); }
      };
   },
   getModel: function (uri) {
      var _this = this;
      return new Promise(function (r) {
         var model = monaco.editor.getModel(uri);
         if (!model) {
            // 从ajax读取文件
            // ajax.get('http://host/to_file_name').then((contents) => {
            //	r(monaco.editor.createModel(contents, 'javascript', uri);)
            // });
            // return;
            return monaco.editor.createModel('function hello() {}', 'javascript', uri);
         }
         r(model);
      });
   }
};

const escapeCharsRegex = /["\\.+*^$()\[\] ]/g;
function convertToZoektRegex(text) {
   return text.replace(escapeCharsRegex, '\\$&');
}

function enableFlameSearchContextMenu() {
   // Register a context menu item for printing selected text
   const selectionContainsMultipleLinesKey = local.editor.createContextKey('selectionContainsMultipleLines', false);
   local.editor.onContextMenu((evt) => {
      const selection = local.editor.getSelection();
      const isMultiLine = (
         selection &&
         !selection.isEmpty() &&
         selection.startLineNumber !== selection.endLineNumber
      );
      selectionContainsMultipleLinesKey.set(isMultiLine);
   });
   local.editor.addAction({
      id: 'flame.search.text',
      label: 'Search as text',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.5,
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
      precondition: 'editorHasSelection && !editorHasMultipleSelections && !selectionContainsMultipleLines',
      run: function(evt) {
         const selection = evt.getSelection();
         const model = evt.getModel();
         const selectedText = model.getValueInRange(selection);
         eventbus.emit('app.opentab', 'search');
         eventbus.emit('navbar.search.input.push', convertToZoektRegex(selectedText));
      return null;
      }
   });
   local.editor.addAction({
      id: 'flame.search.file',
      label: 'Search as file',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.5,
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      precondition: 'editorHasSelection && !editorHasMultipleSelections && !selectionContainsMultipleLines',
      run: function(evt) {
         const selection = evt.getSelection();
         const model = evt.getModel();
         const selectedText = model.getValueInRange(selection);
         eventbus.emit('app.opentab', 'search');
         eventbus.emit('navbar.search.input.push', `f:${convertToZoektRegex(selectedText)}`);
      return null;
      }
   });
}

export function apiAddBreakpoint(lineNumber) {
   _toogleBreakpoint(local.editor, lineNumber, true, false);
}
export function delAddBreakpoint(lineNumber) {
   _toogleBreakpoint(local.editor, lineNumber, false, true);
}
function _toogleBreakpoint(editor, lineNumber, addonly, delonly) {
   // Get current model
   const model = editor.getModel();
   const uri = model.uri.toString();
   if (!local.breakpoints) local.breakpoints = {
      autoId: 1,
      byFile: {},
   };
   const btmap = local.breakpoints.byFile;
   if (!btmap[uri]) btmap[uri] = {};

   // Check if decoration already exists
   const existingDecorations = editor.getLineDecorations(lineNumber)
      .filter(d => d.options.glyphMarginClassName === 'breakpoint-glyph');

   if (existingDecorations.length > 0) {
      // Remove the decoration if it exists
      if (!addonly) {
         editor.deltaDecorations(existingDecorations.map(d => d.id), []);
         delete btmap[uri][lineNumber];
         if (!Object.keys(btmap[uri]).length) {
            delete btmap[uri];
            if (!Object.keys(btmap).length) {
               local.breakpoints.autoId = 1;
            }
         }
      }
   } else {
      // Add the decoration if it doesn't exist
      if (!delonly) {
         editor.deltaDecorations([], [{
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
               isWholeLine: true,
               glyphMarginClassName: 'breakpoint-glyph'
            }
         }]);
         btmap[uri][lineNumber] = local.breakpoints.autoId++;
      }
   }
}
function enableToogleBreakpoint() {
   local.editor.onMouseDown(evt => {
      if (
         evt.target.type !== local.monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
         evt.target.type !== local.monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) return;
      _toogleBreakpoint(local.editor, evt.target.position.lineNumber);
   });
   local.editor.updateOptions({ glyphMargin: true });
}

export function initEditor(dom) {
   const editor_api = monaco.editor.create(dom, {
      readOnly: true,
   }, {
      textModelService: new FlameTextModelService()
   });
   const is_dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
   if (is_dark_mode) monaco.editor.setTheme('vs-dark');

   const resize_ob = new ResizeObserver(() => {
      editor_api.layout();
   });
   resize_ob.observe(dom);

   local.editor = editor_api;
   local.monaco = monaco;
   window._debugEditor = editor_api;
   window._debugMonaco = monaco;
   enableFlameSearchContextMenu();
   enableToogleBreakpoint();
}
