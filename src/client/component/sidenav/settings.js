const {ElemEmpty, ElemAppendText} = require('../../logic/util');

function SideNavSettingsTab() {
   this.ui = {
      self: document.createElement('div')
   };
   this.Render();
}
SideNavSettingsTab.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   Render: function() {
      ElemEmpty(this.ui.self);
      this.ui.self.className = 'full scrollable-y';
      const div = document.createElement('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Settings');
      this.ui.self.appendChild(div);
   },

   Show: function() { this.ui.self.style.display = 'block'; },
   Hide: function() { this.ui.self.style.display = 'none'; },
}

module.exports = {
   SideNavSettingsTab,
};
