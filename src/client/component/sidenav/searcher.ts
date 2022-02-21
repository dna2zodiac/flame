import {
   ElemEmpty,
   ElemAppendText,
   ElemSafeAppendHtml,
   ElemDivMessage,
   ElemIcon
} from '../../logic/util';
import {DataClient} from '../../logic/api';

export interface SearchResultMatch {
   L: number;
   T: string;
}

export interface SearchResult {
   path: string;
   matches: Array<SearchResultMatch>;
}

/*
<div class="item-thin item-blue">
   <a>{path}</a>
   <div class="item-thin item-purple">
      <div class="editor-left-side" style="font: 13px monospace;"><a>{line-number}</a></div>
      <pre class="editor-text"><a>{matched-text}</a></pre>
   </div>
</div>
 */
export class SearchItem {
   ui = {
      self: document.createElement('div'),
      link: document.createElement('a'),
      match: document.createElement('div')
   };
   item: SearchResult;

   constructor(result: SearchResult) {
      this.item = result;
      this.Render();
   }

   GetDom() { return this.ui.self; }
   Dispose() {}
   Render() {
      this.ui.self.className = 'item-thin item-blue search-item';
      ElemAppendText(this.ui.link, this.item.path);
      this.ui.link.href = '#' + this.item.path;
      if (!this.item.matches || !this.item.matches.length) {
         this.ui.self.appendChild(this.ui.link);
         return;
      }
      this.ui.match.className = 'item-thin item-purple full-w scrollable editor-font';
      ElemEmpty(this.ui.match);
      const lineno = document.createElement('div');
      const lines = document.createElement('pre');
      lineno.className = 'editor-left-side';
      lines.className = 'editor-text';
      this.item.matches.forEach((m: SearchResultMatch, i: number) => {
         if (i > 0) {
            lineno.appendChild(document.createElement('br'));
            lines.appendChild(document.createElement('br'));
         }
         const a = document.createElement('a');
         const span = document.createElement('a');
         ElemAppendText(a, `${m.L}`);
         ElemSafeAppendHtml(span, m.T);
         span.href = '#' + this.item.path + '#L=' + m.L;
         lineno.appendChild(a);
         lines.appendChild(span);
      });
      this.ui.match.appendChild(lineno);
      this.ui.match.appendChild(lines);
      this.ui.self.appendChild(this.ui.link);
      this.ui.self.appendChild(this.ui.match);
   }
}

export class SideNavSearcherTab {
   ui = {
      self: document.createElement('div'),
      box: {
         query: document.createElement('input'),
         search: document.createElement('button')
      },
      result: document.createElement('div')
   };

   constructor() {
      this.Render();
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   Render() {
      ElemEmpty(this.ui.self);
      this.ui.self.className = 'full scrollable-y';
      const div = document.createElement('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Search');
      this.ui.self.appendChild(div);

      const box = document.createElement('div');
      box.className = 'item-thin item-yellow flex-table flex-row';
      this.ui.box.query.className = 'item-input flex-auto';
      this.ui.box.search.appendChild(ElemIcon('img/search.svg', 12, 12));
      this.ui.box.search.style.marginRight = '2px';
      box.appendChild(this.ui.box.query);
      box.appendChild(this.ui.box.search);
      this.ui.self.appendChild(box);

      this.ui.self.appendChild(this.ui.result);
   }

   Search(query: string): Promise<any> {
      // TODO: sync search box value
      const spin = document.createElement('span');
      ElemEmpty(this.ui.result);
      spin.className = 'spin spin-sm';
      this.ui.result.appendChild(spin);
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
         obj.items.forEach((item: any) => {
            that.ui.result.appendChild(new SearchItem(item).GetDom());
         });
      }, () => {
         // TODO: handle errors
      });
      return req;
   }

   Show() { this.ui.self.style.display = 'block'; }
   Hide() { this.ui.self.style.display = 'none'; }
}
