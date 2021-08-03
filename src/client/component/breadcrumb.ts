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
      ElemAppendText(this.ui.self, ' # / ');
      let curpath = '/';
      parts.forEach((name) => {
         curpath += name + '/';
         this.ui.self.appendChild(renderLink(name, curpath));
         ElemAppendText(this.ui.self, ' / ');
      });
      this.ui.self.appendChild(renderLink(last, curpath + last));

      function renderLink(name: string, path: string): HTMLElement {
         const a = document.createElement('a');
         a.className = 'breadcrumb-a';
         ElemAppendText(a, name);
         a.href = '#' + path;
         a.setAttribute('data-path', path);
         return a;
      }
   }
}
