import {Elem, ElemAppend, ElemEmpty, ElemAppendText} from '../../logic/util';
import {FolderTree} from '../treeview';

export class SideNavBrowserTab {
   ui = {
      self: Elem('div'),
      treeContainer: Elem('div'),
      tree: Elem('div')
   };
   tree: FolderTree = null;

   constructor() {
      this.tree = new FolderTree(this.ui.tree, {});
      this.tree.root.AsyncUnfold();
      this.Render();
   }

   GetDom() { return this.ui.self; }
   GetTreeContainer() { return this.ui.treeContainer; }
   Dispose() {}

   Render() {
      ElemEmpty(this.ui.self);
      this.ui.self.className = 'flex-table flex-column full fixed';
      const div = Elem('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Browse');
      const divTree = this.ui.treeContainer;
      divTree.className = 'flex10-auto flex-h0 scrollable';
      ElemAppend(divTree, this.ui.tree);
      ElemAppend(this.ui.self, div);
      ElemAppend(this.ui.self, divTree);
   }

   Show() { this.ui.self.style.display = 'flex'; }
   Hide() { this.ui.self.style.display = 'none'; }
}
