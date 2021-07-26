import {ElemEmpty, ElemAppendText} from '../../logic/util';

export class SideNavTeamTab {
   ui = {
      self: document.createElement('div')
   };

   constructor() {
      this.Render();
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   Render() {
      ElemEmpty(this.ui.self);
      const div = document.createElement('div');
      div.className = 'item-thin item-yellow';
      ElemAppendText(div, 'Team');
      this.ui.self.appendChild(div);
   }

   Show() { this.ui.self.style.display = 'block'; }
   Hide() { this.ui.self.style.display = 'none'; }
}
