import {ElemEmpty, ElemAppendText} from '../../logic/util';
import {FolderTree} from '../treeview';

export class SideNavBrowserTab {
   ui = {
      self: document.createElement('div'),
      tree: <any>null
   };

   constructor() {
      this.ui.tree = <any>(new FolderTree(this.ui.self, {}));
      this.ui.tree.root.AsyncUnfold();
      this.Render();
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   Render() {
      ElemEmpty(this.ui.self);
      const div = document.createElement('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Browse');
      this.ui.self.appendChild(div);
   }

   Show() { this.ui.self.style.display = 'block'; }
   Hide() { this.ui.self.style.display = 'none'; }
}
