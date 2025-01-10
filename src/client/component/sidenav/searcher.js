const {
   Elem,
   ElemAppend,
   ElemEmpty,
   ElemAppendText,
   ElemSafeAppendHtml,
   ElemDivMessage,
   ElemIcon,
   CopyToClipboard,
} = require('../../logic/util');
const {DataClient} = require('../../logic/api');

/*
export interface SearchResultMatch {
   L: number;
   T: string;
}

export interface SearchResult {
   path: string;
   matches: Array<SearchResultMatch>;
}
*/

/*
<div class="item-thin item-blue">
   <a>{path}</a>
   <div class="item-thin item-purple">
      <div class="editor-left-side" style="font: 13px monospace;"><a>{line-number}</a></div>
      <pre class="editor-text"><a>{matched-text}</a></pre>
   </div>
</div>
 */
function SearchItem(result) {
   this.ui = {
      self: Elem('div'),
      link: Elem('a'),
      match: Elem('div')
   };
   this.item = result;
   this.Render();
}
SearchItem.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},
   Render: function() {
      this.ui.self.className = 'item-thin item-blue search-item';
      ElemAppendText(this.ui.link, this.item.path);
      this.ui.link.className = 'word-ba';
      this.ui.link.href = '#' + this.item.path;
      if (!this.item.matches || !this.item.matches.length) {
         ElemAppend(this.ui.self, this.ui.link);
         return;
      }
      this.ui.match.className = 'item-thin item-purple full-w scrollable editor-font';
      ElemEmpty(this.ui.match);
      const lineno = Elem('div');
      const lines = Elem('pre');
      lineno.className = 'editor-left-side';
      lines.className = 'editor-text';
      this.item.matches.forEach((m, i) => {
         /*
         if (i > 0) {
            ElemAppend(lineno, Elem('br'));
            ElemAppend(lines, Elem('br'));
         }
         */
         const a = Elem('a');
         const span = Elem('a');
         ElemAppendText(a, `${m.L}`);
         ElemSafeAppendHtml(span, m.T);
         span.href = '#' + this.item.path + '#L=' + m.L;
         ElemAppend(lineno, a);
         ElemAppend(lines, span);
      });
      ElemAppend(this.ui.match, lineno);
      ElemAppend(this.ui.match, lines);
      ElemAppend(this.ui.self, this.ui.link);
      ElemAppend(this.ui.self, this.ui.match);
   },
}

function SideNavSearcherTab() {
   this.ui = {
      self: Elem('div'),
      box: {
         share: Elem('button'),
         query: Elem('input'),
         search: Elem('button')
      },
      result: Elem('div')
   };
   this.Render();
}
SideNavSearcherTab.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   Render: function() {
      ElemEmpty(this.ui.self);
      this.ui.self.className = 'flex-table flex-column full fixed';
      const div = Elem('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Search');
      ElemAppend(this.ui.self, div);

      const box = Elem('div');
      box.className = 'item-thin item-yellow flex-table flex-row';
      this.ui.box.query.className = 'item-input flex11-auto';
      ElemAppend(this.ui.box.share, ElemIcon('img/share.svg', 12, 12));
      this.ui.box.share.style.marginRight = '2px';
      ElemAppend(this.ui.box.search, ElemIcon('img/search.svg', 12, 12));
      this.ui.box.search.style.marginRight = '2px';
      ElemAppend(box, this.ui.box.share);
      ElemAppend(box, this.ui.box.query);
      ElemAppend(box, this.ui.box.search);
      ElemAppend(this.ui.self, box);

      this.ui.result.className = 'flex10-auto flex-h0 scrollable-y';
      ElemAppend(this.ui.self, this.ui.result);
   },

   Search: function(query) {
      // TODO: sync search box value
      const spin = Elem('span');
      ElemEmpty(this.ui.result);
      spin.className = 'spin spin-sm';
      ElemAppend(this.ui.result, spin);
      ElemAppendText(this.ui.result, ' Searching ...');
      const req = DataClient.Project.Search(query, 50).Req();
      const that = this;
      req.then((obj) => {
         ElemEmpty(that.ui.result);
         if (!obj.items || !obj.items.length) {
            ElemDivMessage(
               that.ui.result,
               'Search result: nothing found.',
               'red', 'img/exclamation.svg'
            );
            return;
         }
         obj.items.forEach((item) => {
            ElemAppend(that.ui.result, new SearchItem(item).GetDom());
         });
      }, () => {
         // TODO: handle errors
      });
      return req;
   },

   Share: function() {
      const query = this.ui.box.query.value;
      if (!query) return;
      const loc = window.location;
      CopyToClipboard(loc.protocol + '/' + loc.host + '/#?' + encodeURIComponent(query));
   },

   Show: function() { this.ui.self.style.display = 'flex'; },
   Hide: function() { this.ui.self.style.display = 'none'; },
};

module.exports = {
   SearchItem,
   SideNavSearcherTab,
};
