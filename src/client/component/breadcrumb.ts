import {Env} from '../logic/global';
import {ElemEmpty, ElemAppendText} from '../logic/util';

export class BreadCrumb {
   ui = {
      self: document.createElement('div')
   };
   constructor () {
      this.ui.self.className = 'item-thin item-yellow';
   }

   GetDom() { return this.ui.self; }
   Dispose() {
      if (this.ui.self.parentNode) {
         this.ui.self.parentNode.removeChild(this.ui.self);
      }
   }

   Render(path: string) {
      ElemEmpty(this.ui.self);
      const parts = path.split('/');
      parts.shift();
      const last_ = parts.pop();
      const last = last_ || parts.pop();
      if (!last) return;
      ElemAppendText(this.ui.self, ' # /');
      let curpath = '/';
      parts.forEach((name) => {
         curpath += name + '/';
         const a = document.createElement('a');
         ElemAppendText(a, name);
         a.href = '#' + curpath;
         a.setAttribute('data-path', curpath);
         this.ui.self.appendChild(a);
         ElemAppendText(this.ui.self, ' / ');
      });
      ElemAppendText(this.ui.self, last);
   }
}
