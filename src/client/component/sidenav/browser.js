const {Elem, ElemAppend, ElemEmpty, ElemAppendText} = require('../../logic/util');
const {FolderTree} = require('../treeview');

function SideNavBrowserTab() {
   this.ui = {
      self: Elem('div'),
      treeContainer: Elem('div'),
      tree: Elem('div')
   };
   this.tree = new FolderTree(this.ui.tree, {});
   this.tree.root.AsyncUnfold();
   this.Render();
}
SidenavBrowserTab.prototype = {
   GetDom: function() { return this.ui.self; },
   GetTreeContainer: function() { return this.ui.treeContainer; },
   Dispose: function() {},

   Render: function() {
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
   },

   Show: function() { this.ui.self.style.display = 'flex'; },
   Hide: function() { this.ui.self.style.display = 'none'; },
};

module.exports = {
   SideNavBrowserTab,
};
