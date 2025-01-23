const {
   Elem,
   ElemEmpty,
   ElemAppend,
   ElemAppendText,
} = require('../../logic/util');

function SideNavBookmarkTab() {
   this.ui = {
      self: Elem('div'),
      list: Elem('div'),
      btn: {
         add: Elem('button')
      }
   };
   this.Render();
}
SideNavBookmarkTab.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   Render: function() {
      ElemEmpty(this.ui.self);
      this.ui.self.className = 'flex-table flex-column full fixed';
      const div = Elem('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Bookmark');
      ElemAppendText(div, ' ');
      ElemAppendText(this.ui.btn.add, '+');
      ElemAppend(div, this.ui.btn.add);
      ElemAppend(this.ui.self, div);

      const box = this.ui.list;
      box.className = 'flex10-auto flex-h0 scrollable-y';
      ElemAppend(this.ui.self, box);
   },
   // dup from src/client/component/app.js
   _parseHash: function() {
      const parts = window.location.hash.split('#');
      parts.shift();
      const obj = {};
      obj.path = parts[0];
      parts.forEach(part => {
         const kv = part.split('=');
         obj[decodeURIComponent(kv[0] || '.')] = (
            decodeURIComponent(kv[1] || '')
         );
      });
      return obj;
   },

   Show: function() { this.ui.self.style.display = 'flex'; },
   Hide: function() { this.ui.self.style.display = 'none'; },
};

/*
db: bookmark-<year>-<month>-<day>-<random>
{
   "T": <timestamp>,
   "N": <name>,
   "L": [{
      "P": <path>,
      "L": [{
         "Y": <line-number>,
         "X": <line-text>
      }]
   }]
}
*/

function BookmarkItem(name, path, L, line) {
   this.ui = {
      self: Elem('div'),
      btn: {
         close: Elem('button')
      }
   };
   this.Render(name, path, L, line ? (line.length > 100 ? (
      line.substring(0, 100) + ' ...'
   ) : line) : '');
}
BookmarkItem.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   Render: function(name, path, L, line) {
      const a = Elem('a');
      ElemAppendText(a, name);
      a.href = '#' + path;

      const text = Elem('div');
      const aL = Elem('a');
      text.className = 'text-ellipsis';
      ElemAppendText(aL, '' + L);
      aL.href = '#' + path + '#L=' + L;
      ElemAppend(text, aL);
      ElemAppendText(text, ' ');
      ElemAppendText(text, line);

      ElemAppendText(this.ui.btn.close, 'X');

      ElemAppend(this.ui.self, this.ui.btn.close);
      ElemAppendText(this.ui.self, ' ');
      ElemAppend(this.ui.self, a);
      ElemAppendText(this.ui.self, ' ');
      if (L) ElemAppend(this.ui.self, text);

      /* dirty event listener */
      a.style.wordBreak = 'break-all';
      const that = this;
      this.ui.btn.close.addEventListener('click', onClose);
      function onClose() {
         that.ui.btn.close.removeEventListener('click', onClose);
         if (that.ui.self.parentNode) {
            that.ui.self.parentNode.removeChild(that.ui.self);
         }
      }
   }
};

module.exports = {
   SideNavBookmarkTab,
   BookmarkItem,
};
