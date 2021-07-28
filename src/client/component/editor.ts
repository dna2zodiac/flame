import {ElemEmpty, ElemAppendText} from '../logic/util';

export class SourceCodeViewer {
   opt: any = {};
   lines: string[] = [];
   ui = {
      self: document.createElement('div'),
      container: document.createElement('div'),
      leftSide: document.createElement('div'),
      lineNumber: document.createElement('div'),
      blame: document.createElement('div'),
      text: document.createElement('pre'),
      highlight: document.createElement('div'),
      extra: {
         highlight: {
            line: document.createElement('div')
         }
      }
   };
   events: any = {};
   cache = {
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

   Render(text: string) {
      this.lines = text.split('\n');
      this.ui.self.className = 'full';
      this.ui.container.className = 'editor-container';
      ElemEmpty(this.ui.lineNumber);
      ElemEmpty(this.ui.text);
      if (this.lines.length) {
         this.lines.forEach((line: string, i: number) => {
            if (i > 0) {
               this.ui.lineNumber.appendChild(document.createElement('br'));
               this.ui.text.appendChild(document.createElement('br'));
            }
            const a = document.createElement('a');
            ElemAppendText(a, '' + (i+1));
            this.ui.lineNumber.append(a);
            const span = document.createElement('span');
            ElemAppendText(span, line);
            this.ui.text.appendChild(span);
         });
      } else {
         // TODO: no conent
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
         if (linenumber <= 0) return;
         if (linenumber > that.lines.length) return;
         if (that.opt.onClickLineNumber) {
            that.opt.onClickLineNumber(linenumber);
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

   LineHighlight (startLineNumber: number, endLineNumber: number) {
      const sted = this.checkStartEndLineNumber(
         startLineNumber, endLineNumber
      );
      const div = this.ui.extra.highlight.line;
      div.style.display = 'none';
      if (sted[0] < 0) return;
      const hL = (<HTMLElement>this.ui.lineNumber.children[0]).offsetHeight;
      div.style.width = this.cache.maxLineWidth + 'px';
      const top = (sted[0] - 1) * hL, bottom = (sted[1] - 1) * hL;
      div.style.height = (bottom - top) + 'px';
      div.style.top = top + 'px';
      div.style.left = '0px';
      div.style.backgroundColor = '#ff7';
      div.style.display = 'block';
      this.ui.highlight.appendChild(div);
   }

   ScrollToLine (startLineNumber: number, endLineNumber: number) {
      const sted = this.checkStartEndLineNumber(
         startLineNumber, endLineNumber
      );
      if (sted[0] < 0) return;
      const n = this.lines.length;
      this.ui.extra.highlight.line.style.display = 'none';

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
      // this.LineHighlight(startLineNumber, endLineNumber);
   }
}
