import * as monaco from 'monaco-editor';

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

export function initEditor(dom) {
   const editor_api = monaco.editor.create(dom, {
      readOnly: true,
   }, {
      textModelService: new FlameTextModelService()
   });

   const resize_ob = new ResizeObserver(() => {
      editor_api.layout();
   });
   resize_ob.observe(dom);

   window._debugEditor = editor_api;
}
