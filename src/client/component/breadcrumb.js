const {Env} = require('../logic/global');
const {ElemEmpty, ElemAppendText} = require('../logic/util');

function BreadCrumb() {
   this.ui = {
      self: document.createElement('div')
   };
   this.ui.self.className = 'item-thin item-yellow';
}
BreadCrumb.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {
      if (this.ui.self.parentNode) {
         this.ui.self.parentNode.removeChild(this.ui.self);
      }
   },

   Render: function(path) {
      ElemEmpty(this.ui.self);
      const parts = path.split('/');
      parts.shift();
      const last_ = parts.pop();
      const last = last_ || parts.pop();
      if (!last) return;
      ElemAppendText(this.ui.self, ' # / ');
      let curpath = '/';
      parts.forEach((name) => {
         curpath += name + '/';
         this.ui.self.appendChild(renderLink(name, curpath));
         ElemAppendText(this.ui.self, ' / ');
      });
      this.ui.self.appendChild(renderLink(last, curpath + last));

      function renderLink(name, path) {
         const a = document.createElement('a');
         a.className = 'breadcrumb-a';
         ElemAppendText(a, name);
         a.href = '#' + path;
         a.setAttribute('data-path', path);
         return a;
      }
   },
};

module.exports = {
   BreadCrumb,
};
