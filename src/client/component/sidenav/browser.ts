import {ElemEmpty, ElemAppendText} from '../../logic/util';
import {FolderTree} from '../treeview';

export class SideNavBrowserTab {
   ui = {
      self: document.createElement('div'),
      tree: document.createElement('div')
   };
   tree: FolderTree = null;

   constructor() {
      this.tree = new FolderTree(this.ui.tree, {});
      this.tree.root.AsyncUnfold();
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
      this.ui.self.appendChild(this.ui.tree);
   }

   Show() { this.ui.self.style.display = 'block'; }
   Hide() { this.ui.self.style.display = 'none'; }
}
