import {ElemEmpty, ElemAppendText} from '../logic/util';
import {StyleMap} from '../style/style';
import {SyntaxItem} from '../../share/common';

export interface Point {
   x: number;
   y: number;
}

export class SourceCodeViewer {
   opt: any = {};
   lines: string[] = [];
   ui = {
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
            line: <HTMLDivElement[]>[]
         }
      }
   };
   events: any = {};
   cache = {
      font: '',
      maxLineWidth: 0
   };

   constructor(opt: any = null) {
      this.opt = opt || this.opt;
   }

   GetDom() { return this.ui.self; }
   Dispose() {
      this.ui.lineNumber.removeEventListener(
         'click', this.events.onClickLineNumber
      );
      if (this.ui.self.parentNode) {
         this.ui.self.parentNode.removeChild(this.ui.self);
      }
   }

   SetStyle(styleMap: any) {
      this.ui.style.Compile(styleMap);
      const styleDom = this.ui.style.GetDom();
      if (!styleDom.parentNode) {
         this.ui.self.insertBefore(
            styleDom,
            this.ui.self.children[0]
         );
      }
   }

   RenderSyntax(syntaxMap: SyntaxItem[]) {
      // syntaxMap [ { L, st, ed, name } ... ]
      // e.g. [ { L: 0, st: 0, ed: 4, name: "comment" } ]
      // "this is a test" -> <span>
      //                        <span class="flame-editor-comment">this</span>
      //                        <span> is a test</span>
      //                     </span>
      ElemEmpty(this.ui.lineNumber);
      ElemEmpty(this.ui.text);

      const syntaxMapByLine: any = {};
      syntaxMap.forEach((item: any) => {
         if (!syntaxMapByLine[item.L]) syntaxMapByLine[item.L] = [];
         syntaxMapByLine[item.L].push(item);
      });
      this.lines.forEach((line: string, i: number) => {
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
            ElemAppendText(span, line);
         } else {
            // XXX: we do not consider overlap now
            syntax.sort((a: any, b: any) => a.st - b.st);
            const seq: any = []; // [{name, len}, ...]
            let offset: number = 0;
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
      });
   }

   Render(text: string) {
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
      this.ui.text.className = 'editor-text flex-auto';
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
      this.events.onClickLineNumber = (evt: any) => {
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
   }

   computeCache() {
      const n = this.ui.text.children.length;
      for (let i = 0; i < n; i += 2) {
         const el = <HTMLElement>this.ui.text.children[i];
         if (this.cache.maxLineWidth < el.offsetWidth) {
            this.cache.maxLineWidth = el.offsetWidth;
         }
      }
      if (this.ui.self.offsetWidth > this.cache.maxLineWidth) {
         this.cache.maxLineWidth = this.ui.self.offsetWidth;
      }
   }

   OnClickLineNumber(fn: any) {
      this.opt.onClickLineNumber = fn;
   }

   BindMetadata (metadata: any) {
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
      const map: any = {}
      let info: any;
      if (!metadata) return;
      info = metadata.symbol;
      info && info.forEach(function (x: any) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.comment;
      info && info.forEach(function (x: any) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.linkage;
      info && info.forEach(function (x: any) {
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
   }

   GetLine(linenumber: number): string | null {
      if (linenumber <= 0) return null;
      if (linenumber > this.lines.length) return null;
      return this.lines[linenumber - 1];
   }

   checkStartEndLineNumber(start: number, end: number): number[] {
      const r: number[] = [-1, -1];
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
   }

   LineHighlight (startLineNumber: number, endLineNumber: number, appendMode: boolean = false) {
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
      const hL = (<HTMLElement>this.ui.lineNumber.children[0]).offsetHeight;
      div.style.width = this.cache.maxLineWidth + 'px';
      const top = (sted[0] - 1) * hL, bottom = (sted[1] - 1) * hL;
      div.className = 'line';
      div.style.height = (bottom - top) + 'px';
      div.style.top = top + 'px';
      div.style.left = '0px';
      div.style.display = 'block';
      this.ui.highlight.appendChild(div);
      divs.push(div);
   }

   ScrollToLine (startLineNumber: number, endLineNumber: number) {
      const sted = this.checkStartEndLineNumber(
         startLineNumber, endLineNumber
      );
      if (sted[0] < 0) return;
      const n = this.lines.length;

      const hL = (<HTMLElement>this.ui.lineNumber.children[0]).offsetHeight;
      const curTop = this.ui.container.scrollTop;
      const curH = this.ui.container.offsetHeight;
      var top = (sted[0] - 1) * hL, bottom = (sted[1] - 1) * hL;
      var x = this.ui.container.scrollLeft;
      if (curTop > top) {
         this.ui.container.scrollTo(x, top);
      } else if (curTop + curH < bottom) {
         var y = top + curH - (bottom - top);
         if (y > top) y = top;
         this.ui.container.scrollTo(x, y);
      }
      // this.ui.extra.highlight.line.style.display = 'none';
      // this.LineHighlight(startLineNumber, endLineNumber);
   }

   cacheSourceCodeFont() {
      if (this.cache.font) return this.cache.font;
      this.cache.font = window.getComputedStyle(this.ui.text).font;
      return this.cache.font;
   }

   Px2Pos(px: Point): Point {
      const hL = (<HTMLElement>this.ui.lineNumber.children[0]).offsetHeight;
      const canvas = document.createElement('canvas');
      const pen = canvas.getContext("2d");
      canvas.style.font = this.cacheSourceCodeFont();
      const L = px.y < 0?-1:(px.y >= this.lines.length?-1:(~~(px.y / hL)));
      if (L < 0) return { x: -1, y: L };
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
   }

   Pos2Px(pos: Point): Point {
      const line = this.GetLine(pos.y+1);
      const hL = (<HTMLElement>this.ui.lineNumber.children[0]).offsetHeight;
      const canvas = document.createElement('canvas');
      const pen = canvas.getContext("2d");
      canvas.style.font = this.cacheSourceCodeFont();
      const m0 = pen.measureText(line.substring(0, pos.x));
      const m1 = pen.measureText(line.substring(0, pos.x+1));
      return { x: (m0.width + m1.width)/2, y: hL * (Math.floor(pos.y) + 0.5) };
   }
}
