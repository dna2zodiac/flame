const {ElemEmpty, ElemAppendText} = require('../logic/util');
const {StyleMap} = require('../style/style');
const {SyntaxItem} = require('../../share/common');
const {BinarySearch} = require('../../share/algorithm');
const {styleObjects} = require('../style/editor');

/*
export interface Point {
   x: number;
   y: number;
}

export interface Range {
   L1: number;
   o1: number;
   L2: number;
   o2: number;
}
*/

const LINE_GROUP = 200;

function SourceCodeViewer(opt) {
   this.opt = Object.assign({}, opt);
   this.lines = [];
   this.ui = {
      self: document.createElement('div'),
      style: new StyleMap(),
      container: document.createElement('div'),
      leftSide: document.createElement('div'),
      lineNumber: document.createElement('div'),
      blame: document.createElement('div'),
      text: document.createElement('pre'),
      highlight: document.createElement('div'),
      extra: {
         highlight: {
            line: []
         }
      }
   };
   this.events = {};
   this.cache = {
      font: '',
      maxLineWidth: 0
   };
   this.renderStat = {
      busy: false,
      group: 0,
      queue: [],
      postQueue: []
   };
}
SourceCodeViewer.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {
      this.ui.lineNumber.removeEventListener(
         'click', this.events.onClickLineNumber
      );
      if (this.ui.self.parentNode) {
         this.ui.self.parentNode.removeChild(this.ui.self);
      }
   },

   SetStyle: function(styleMap) {
      if (!styleMap) styleMap = styleObjects;
      this.ui.style.Compile(styleMap);
      const styleDom = this.ui.style.GetDom();
      if (!styleDom.parentNode) {
         this.ui.self.insertBefore(
            styleDom,
            this.ui.self.children[0]
         );
      }
   },

   _ActPostRender: function() {
      while (this.renderStat.postQueue.length) {
         const post = this.renderStat.postQueue.shift();
         switch(post.act) {
         case 'scroll': this._ScrollToLine(post.st || 0, post.ed || 0); break;
         case 'highlight': this._LineHighlight(post.st, post.ed, post.ap); break;
         }
      }
   },
   _RenderSyntaxSlice: async function(syntaxMapByLine, stI, edI, groupId) {
      // stop current render if next render comes
      if (groupId !== this.renderStat.group) return;
      const n = this.lines.length;
      for (let i = stI; i < edI && i < n; i++) {
         const line = this.lines[i];
         if (i > 0) {
            this.ui.lineNumber.appendChild(document.createElement('br'));
            this.ui.text.appendChild(document.createElement('br'));
         }
         const a = document.createElement('a');
         ElemAppendText(a, '' + (i+1));
         this.ui.lineNumber.append(a);

         const span = document.createElement('span');
         const syntax = syntaxMapByLine[i];
         if (!syntax || syntax.length === 0) {
            const one = document.createElement('span');
            ElemAppendText(one, line);
            span.appendChild(one);
         } else {
            // XXX: we do not consider overlap now
            syntax.sort((a, b) => a.st - b.st);
            const seq = []; // [{name, len}, ...]
            let offset = 0;
            for (let j = 0; j < syntax.length; j++) {
               const symbol = syntax[j];
               if (symbol.st > offset) {
                  seq.push({ len: symbol.st - offset });
               }
               seq.push({ name: symbol.name, len: symbol.ed - symbol.st });
               offset = symbol.ed;
            }
            if (offset < line.length) {
               seq.push({ len: line.length - offset });
            }

            offset = 0;
            for (let j = 0; j < seq.length; j++) {
               const symbol = seq[j];
               const subspan = document.createElement('span');
               ElemAppendText(subspan, line.substring(offset, offset + symbol.len));
               offset += symbol.len;
               if (symbol.name) {
                  subspan.classList.add(`flame-editor-${symbol.name}`);
               }
               span.appendChild(subspan);
            }
         }
         this.ui.text.appendChild(span);
      }
   },
   _RenderSyntax: async function(syntaxMapByLine, groupId) {
      // use async function to render lines
      // use task queue to render lines; between tasks, ensure UI reponsive
      if (this.renderStat.busy) return;
      if (!this.renderStat.queue.length) {
         if (groupId === this.renderStat.group) {
            this._ActPostRender();
         }
         return;
      }
      this.renderStat.busy = true;
      const stI = this.renderStat.queue.shift();
      // guarantee this await no throwing exceptions
      await this._RenderSyntaxSlice(syntaxMapByLine, stI, stI+LINE_GROUP, groupId);
      this.renderStat.busy = false;
      if (groupId !== this.renderStat.group) groupId = this.renderStat.group;
      this._RenderSyntax(syntaxMapByLine, groupId);
   },
   RenderSyntax: async function(syntaxMap) {
      // syntaxMap [ { L, st, ed, name } ... ]
      // e.g. [ { L: 0, st: 0, ed: 4, name: "comment" } ]
      // "this is a test" -> <span>
      //                        <span class="flame-editor-comment">this</span>
      //                        <span> is a test</span>
      //                     </span>
      ElemEmpty(this.ui.lineNumber);
      ElemEmpty(this.ui.text);

      const syntaxMapByLine = {};
      syntaxMap.forEach(item => {
         if (!syntaxMapByLine[item.L]) syntaxMapByLine[item.L] = [];
         syntaxMapByLine[item.L].push(item);
      });

      // render, if new render, stop prev render
      this.renderStat.group = (this.renderStat.group + 1) % 10000;
      this.renderStat.queue = [];
      for (let i = 0, n = this.lines.length; i < n; i += LINE_GROUP) {
         this.renderStat.queue.push(i);
      }
      this._RenderSyntax(syntaxMapByLine, this.renderStat.group);
   },

   Render: function(text) {
      this.lines = text.split('\n');
      this.ui.self.className = 'full';
      this.ui.container.className = 'editor-container';
      ElemEmpty(this.ui.lineNumber);
      ElemEmpty(this.ui.text);
      if (this.lines.length) {
         this.RenderSyntax([]);
      } else {
         // TODO: no content
         // TODO: loading
      }
      const sideFlex = document.createElement('div');
      sideFlex.className = 'editor-side-flex';
      this.ui.leftSide.className = 'editor-left-side';
      this.ui.text.className = 'editor-text flex11-auto';
      this.ui.lineNumber.className = 'editor-linenumber';
      this.ui.highlight.className = 'editor-highlight';
      this.ui.blame.style.display = 'none';

      sideFlex.appendChild(this.ui.lineNumber);
      sideFlex.appendChild(this.ui.blame);
      this.ui.leftSide.appendChild(sideFlex);
      this.ui.container.appendChild(this.ui.highlight);
      this.ui.container.appendChild(this.ui.leftSide);
      this.ui.container.appendChild(this.ui.text);
      this.ui.self.appendChild(this.ui.container);

      const textStyle = window.getComputedStyle(this.ui.text);
      sideFlex.style.fontFamily = textStyle.fontFamily;
      sideFlex.style.fontSize = textStyle.fontSize;
      const that = this;
      this.events.onClickLineNumber = evt => {
         if (evt.target.tagName.toLowerCase() !== 'a') return;
         const linenumber = parseInt(evt.target.textContent, 10);
         const keyOn = {
            ctrl: evt.ctrlKey,
            shift: evt.shiftKey,
            alt: evt.altKey,
            meta: evt.metaKey,
         };
         if (linenumber <= 0) return;
         if (linenumber > that.lines.length) return;
         if (that.opt.onClickLineNumber) {
            that.opt.onClickLineNumber(linenumber, keyOn);
         }
      };
      this.ui.lineNumber.addEventListener(
         'click', this.events.onClickLineNumber
      );
      this.computeCache();
   },

   computeCache: function() {
      const n = this.ui.text.children.length;
      for (let i = 0; i < n; i += 2) {
         const el = this.ui.text.children[i];
         if (this.cache.maxLineWidth < el.offsetWidth) {
            this.cache.maxLineWidth = el.offsetWidth;
         }
      }
      if (this.ui.self.offsetWidth > this.cache.maxLineWidth) {
         this.cache.maxLineWidth = this.ui.self.offsetWidth;
      }
   },

   OnClickLineNumber: function(fn) {
      this.opt.onClickLineNumber = fn;
   },

   BindMetadata: function(metadata) {
      // TODO: it is a function to highlight line number block
      //       when there are symbols, comments or linkages in
      //       a line, the name `BindMetadata` is confusing
      /*
         metadata = {
            symbol:  [{linenumber}, ...],
            comment: [{linenumber}, ...],
            linkage: [{linenumber}, ...]
         }
      */
      const n = this.ui.lineNumber.children.length;
      for (let i = 0; i < n; i += 2) {
         const el = this.ui.lineNumber.children[i];
         el.classList.remove('active');
      }
      const map = {}
      let info;
      if (!metadata) return;
      info = metadata.symbol;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.comment;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.linkage;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      Object.keys(map).forEach(function (lnstr) {
         const linenumber = parseInt(lnstr, 10);
         const el = this.ui.lineNumber.children[linenumber * 2 - 2];
         if (!el) return;
         // TODO: in future, more active-1, active-2, ...
         el.classList.add('active');
      });
   },

   GetLine: function(linenumber) {
      if (linenumber <= 0) return null;
      if (linenumber > this.lines.length) return null;
      return this.lines[linenumber - 1];
   },

   checkStartEndLineNumber: function(start, end) {
      const r = [-1, -1];
      const n = this.lines.length;
      if (!start || start === end) return r;
      if (!end) end = start + 1;
      if (start > end) {
         start += end;
         end = start - end;
         start = start - end;
      }
      if (start < 0 || end < 0) return r;
      if (start > n) return r;
      if (end > n + 1) return r;
      r[0] = start;
      r[1] = end;
      return r;
   },

   getLineTop: function(i) {
      if (i < 0) return 0;
      const n = ~~(this.ui.lineNumber.children.length / 2) + 1;
      if (i > n) return 0;
      const el = this.ui.lineNumber.children[i * 2];
      if (i === n && !el) return this.ui.lineNumber.offsetHeight;
      if (!el) return 0;
      return el.offsetTop;
   },

   _LineHighlight: function(startLineNumber, endLineNumber, appendMode) {
      // if appendMode is true, create a new div
      // otherwise remove all previous divs and then use a new one for highlight
      const sted = this.checkStartEndLineNumber(
         startLineNumber, endLineNumber
      );
      const divs = this.ui.extra.highlight.line;
      if (!appendMode) {
         while (divs.length) {
            const one = divs.pop();
            if (one.parentElement) {
               one.parentElement.removeChild(one);
            }
         }
      }
      if (sted[0] < 0) return;
      const div = document.createElement('div');
      div.style.width = this.cache.maxLineWidth + 'px';
      const lineItop = sted[0] - 1, lineIbottom = sted[1] - 1;
      const top = this.getLineTop(lineItop), bottom = this.getLineTop(lineIbottom);
      div.className = 'line';
      div.style.height = (bottom - top) + 'px';
      div.style.top = top + 'px';
      div.style.left = '0px';
      div.style.display = 'block';
      this.ui.highlight.appendChild(div);
      divs.push(div);
   },
   LineHighlight: function(startLineNumber, endLineNumber, appendMode) {
      if (!appendMode) {
         this.renderStat.postQueue = this.renderStat.postQueue.filter(function (z) {
            return z.act !== 'highlight';
         });
      }
      this.renderStat.postQueue.push({
         act: 'highlight',
         st: startLineNumber,
         ed: endLineNumber,
         ap: appendMode
      });
      // XXX: risk to pass null
      this._RenderSyntax(null, this.renderStat.group);
   },

   _ScrollToLine: function(startLineNumber, endLineNumber) {
      const sted = this.checkStartEndLineNumber(
         startLineNumber, endLineNumber
      );
      if (sted[0] < 0) return;
      const n = this.lines.length;

      const curTop = this.ui.container.scrollTop;
      const curH = this.ui.container.offsetHeight;
      const lineItop = sted[0] - 1, lineIbottom = sted[1] - 1;
      let top = this.getLineTop(lineItop), bottom = this.getLineTop(lineIbottom);
      let x = this.ui.container.scrollLeft;
      if (curTop > top) {
         this.ui.container.scrollTo(x, top);
      } else if (curTop + curH < bottom) {
         var y = top + curH - (bottom - top);
         if (y > top) y = top;
         this.ui.container.scrollTo(x, y);
      }
      // this.ui.extra.highlight.line.style.display = 'none';
      // this.LineHighlight(startLineNumber, endLineNumber);
   },
   ScrollToLine: function(startLineNumber, endLineNumber) {
      this.renderStat.postQueue = this.renderStat.postQueue.filter(function (z) {
         return z.act !== 'scroll';
      });
      this.renderStat.postQueue.push({
         act: 'scroll',
         st: startLineNumber,
         ed: endLineNumber
      });
      // XXX: risk to pass null
      this._RenderSyntax(null, this.renderStat.group);
   },

   cacheSourceCodeFont: function() {
      if (this.cache.font) return this.cache.font;
      this.cache.font = window.getComputedStyle(this.ui.text).font;
      return this.cache.font;
   },

   Px2Pos: function(px) {
      const canvas = document.createElement('canvas');
      const pen = canvas.getContext("2d");
      canvas.style.font = this.cacheSourceCodeFont();
      // calculate Y (lineNumber)
      let L = -1;
      if (px.y >= 0 && px.y < this.ui.lineNumber.offsetHeight) {
         L = BinarySearch(0, this.lines.length, px.y, this.getLineTop.bind(this));
      }
      if (L < 0) return { x: -1, y: -1 };

      // calculate X (lineColumn)
      const line = this.GetLine(L + 1);
      let st = 0, ed = line.length, mx = -1;
      if (pen.measureText(line).width < px.x || 0 > px.x) {
         return {x: -1, y: L};
      }
      while (st < ed-1) {
         const mid = ~~((st + ed) / 2);
         const m = pen.measureText(line.substring(st, mid));
         if (px.x < m.width) {
            ed = mid;
         } else if (px.x > m.width) {
            st = mid;
         } else {
            mx = st;
            break;
         }
      }
      if (mx < 0) {
         if (ed - st === 1) {
            mx = st;
         }
         // if (ed === st) // should not be
      }
      return {x: mx, y: L};
   },

   Pos2Px: function(pos) {
      const line = this.GetLine(pos.y+1);
      const canvas = document.createElement('canvas');
      const pen = canvas.getContext("2d");
      canvas.style.font = this.cacheSourceCodeFont();
      const m0 = pen.measureText(line.substring(0, pos.x));
      const m1 = pen.measureText(line.substring(0, pos.x+1));
      return { x: (m0.width + m1.width)/2, y: (this.getLineTop(pos.y) + this.getLineTop(pos.y + 1))/2 };
   },

   GetSelectedRange: function() {
      const S = document.getSelection();
      const R = S.getRangeAt(0);

      const ac = R.commonAncestorContainer;
      if (!this.isTextChild(ac)) return null;
      // if (!ac.classList.contains('editor-text')) return null;

      const sc = R.startContainer;
      const so = R.startOffset;
      const ec = R.endContainer;
      const eo = R.endOffset;

      if (sc === ec && so === eo) return null;
      // <span <span <text> > <span <text> > ... ><br>
      const scpp = sc.parentElement.parentElement;
      const ecpp = ec.parentElement.parentElement;
      const range = {
         L1: this.getSpanL(scpp),
         o1: this.getSpanC(scpp, sc.parentElement) + so,
         L2: this.getSpanL(ecpp),
         o2: this.getSpanC(ecpp, ec.parentElement) + eo,
      };
      if (range.L1 < 0 || range.L2 < 0) return null;
      if (range.o1 < 0 || range.o2 < 0) return null;
      if (range.L1 > range.L2 || (range.L1 === range.L2 && range.o1 > range.o2)) {
         range.L1 = range.L1 ^ range.L2;
         range.L2 = range.L1 ^ range.L2;
         range.L1 = range.L1 ^ range.L2;
         range.o1 = range.o1 ^ range.o2;
         range.o2 = range.o1 ^ range.o2;
         range.o1 = range.o1 ^ range.o2;
      }
      return range;
   },
   isTextChild: function(span) {
      const body = document.body;
      const root = this.ui.text;
      let cursor = span;
      while (cursor !== body && cursor.parentElement) {
         if (cursor === root) return true;
         cursor = cursor.parentElement;
      }
      return false;
   },
   getSpanL: function(span) {
      const cs = this.ui.text;
      const n = cs.children.length;
      let i = 0, L = 0;
      for (; i < n; i++) {
         const c = cs.children[i];
         if (c === span) break;
         if (c.tagName.toLowerCase() === 'br') L++;
      }
      if (i === n) return -1;
      return L;
   },
   getSpanC: function(container, span) {
      const n = container.children.length;
      let o = 0;
      for (let i = 0; i < n; i++) {
         const c = container.children[i];
         if (c === span) return o;
         o += c.textContent.length;
      }
      return -Infinity;
   },
};

module.exports = {
   SourceCodeViewer,
};
