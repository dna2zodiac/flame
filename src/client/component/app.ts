import {Env} from '../logic/global';
import {BreadCrumb} from './breadcrumb';
import {SideNavSearcherTab} from './sidenav/searcher';
import {SideNavBrowserTab} from './sidenav/browser';
import {SideNavAnalyzerTab} from './sidenav/analyzer';
import {SideNavTeamTab} from './sidenav/team';
import {SideNavSettingsTab} from './sidenav/settings';

class AppIconButton {
   ui = {
      self: document.createElement('div'),
      btn: document.createElement('button')
   };
   events: any = {};

   constructor(name: string, imgSrc: string) {
      var img = document.createElement('img');
      img.src = imgSrc;
      this.ui.btn.className = 'nav-icon-btn';
      this.ui.btn.title = name;
      this.ui.btn.setAttribute('data-tab', name);
      this.ui.btn.appendChild(img);
      this.ui.self.appendChild(this.ui.btn);
   }

   GetDom() { return this.ui.self; }
   Dispose() {
      this.OnClick(null);
   }

   OnClick(fn: any) {
      if (fn) {
         if (this.events.onClick) this.OnClick(null);
         this.events.onClick = fn;
         this.ui.btn.addEventListener(
            'click', this.events.onClick
         );
      } else if (this.events.onClick) {
         this.ui.btn.removeEventListener(
            'click', this.events.onClick
         );
         this.events.onClick = null;
      }
   }

   Name(): string {
      return this.ui.btn.getAttribute('data-tab');
   }
   IsActive(): boolean {
      return this.ui.btn.classList.contains('active');
   }
   Active() {
      this.ui.btn.classList.add('active');
   }
   Inactive() {
      this.ui.btn.classList.remove('active');
   }
}

class AppIconNav {
   ui = {
      self: document.createElement('div'),
      btn: [
         new AppIconButton('Search', 'img/search.svg'),
         new AppIconButton('Browse', 'img/folder.svg'),
         new AppIconButton('Analysis', 'img/clipboard.svg'),
         new AppIconButton('Team', 'img/talk-bubbles.svg'),
         new AppIconButton('Settings', 'img/cog.svg')
      ]
   };
   tab: string = null;

   constructor () {
      this.ui.self.className = 'app-icon-nav';
   }

   GetDom() { return this.ui.self; }
   Dispose() {
      this.ui.btn.forEach((btn: AppIconButton) => {
         btn.Dispose();
      });
   }

   Touch (name: string) {
      this.tab = null;
      this.ui.btn.forEach((btn: AppIconButton) => {
         if (btn.Name() === name && !btn.IsActive()) {
            btn.Active();
            this.tab = btn.Name();
         } else {
            btn.Inactive();
         }
      });
   }
   Tab(): string {
      return this.tab;
   }
}

class AppSideNav {
   ui = {
      self: document.createElement('div'),
      tab: {
         Search: new SideNavSearcherTab(),
         Browse: new SideNavBrowserTab(),
         Analysis: new SideNavAnalyzerTab(),
         Team: new SideNavTeamTab(),
         Settings: new SideNavSettingsTab()
      }
   };
   tab: string = null;

   constructor () {
      this.ui.self.className = 'full-h scrollable-y';
      this.ui.self.style.width = '300px';
      // TODO: side nav render
      Object.keys(this.ui.tab).forEach((name: string) => {
         const tab = (<any>this.ui.tab)[name];
         this.ui.self.appendChild(tab.GetDom());
      });
      this.Hide();
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   Show() {
      // TODO: if screen too small,
      //       get out of parent div and become position=fixed
      this.ui.self.style.display = 'block';
   }
   Hide() {
      this.ui.self.style.display = 'none';
   }

   Touch (name: string) {
      const cur = this.tab;
      this.tab = null;
      Object.keys(this.ui.tab).forEach((name0: string) => {
         const tab = (<any>this.ui.tab)[name0];
         tab.Hide();
         if (cur !== name && name0 === name) {
            tab.Show();
            this.tab = name;
         }
      });
      if (this.tab) {
         this.Show();
      } else {
         this.Hide();
      }
   }
   Tab(): string {
      return this.tab;
   }
}

class AppMainView {
   ui = {
      self: document.createElement('div'),
      nav: new BreadCrumb(),
      view: document.createElement('div')
   };

   constructor () {
      this.ui.self.className = 'flex-auto flex-w0';
      const div = document.createElement('div');
      div.className = 'flex-frame flex-column';
      this.ui.view.className = 'flex-auto flex-h0';
      div.appendChild(this.ui.nav.GetDom());
      this.ui.nav.Render('/test0/test1/test2/README.md'); /* debug */
      this.ui.view.innerHTML = 'It works!';
      div.appendChild(this.ui.view);
      this.ui.self.appendChild(div);
      // TODO: main view render
   }

   GetDom() { return this.ui.self; }
   Dispose() {}
}

class BodyConnector {
   constructor() {}

   Bind(nav: AppIconNav, side: AppSideNav, view: AppMainView) {
      nav.ui.btn.forEach((btn: AppIconButton) => {
         nav.ui.self.appendChild(btn.GetDom());
         btn.OnClick((evt: any) => {
            const name = btn.Name();
            nav.Touch(name);
            side.Touch(name);
         });
      });
   }
}

export class AppFrame {
   ui = {
      self: document.createElement('div'),
      head: document.createElement('header'),
      body: document.createElement('div'),
      foot: document.createElement('footer'),
      view: new AppMainView(),
      nav: {
         icon: new AppIconNav(),
         side: new AppSideNav()
      }
   };

   constructor() {
      document.body.className = 'scrollable-no';
      this.ui.self.className = 'flex-frame flex-column';
      this.ui.self.appendChild(this.buildHead());
      this.ui.self.appendChild(this.buildBody());
      this.ui.self.appendChild(this.buildFoot());
      document.body.appendChild(this.ui.self);

      new BodyConnector().Bind(
         this.ui.nav.icon,
         this.ui.nav.side,
         this.ui.view
      );
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   buildHead() {
      this.ui.head.className = 'header';
      const div = document.createElement('div');
      div.className = 'branding';
      const img = document.createElement('img');
      img.src = 'img/logo.png';
      img.className = 'header-icon';
      div.appendChild(img);
      const span = document.createElement('span');
      span.className = 'title';
      span.appendChild(document.createTextNode('Flame'))
      div.appendChild(span);
      this.ui.head.appendChild(div);
      return this.ui.head;
   }

   buildBody() {
      this.ui.body.className = 'flex-auto flex-h0';
      const container = document.createElement('div');
      const div = document.createElement('div');
      container.className = 'full scrollable-no';
      div.className = 'flex-frame flex-row';
      div.appendChild(this.ui.nav.icon.GetDom());
      div.appendChild(this.ui.nav.side.GetDom());
      div.appendChild(this.ui.view.GetDom());
      container.appendChild(div);
      this.ui.body.appendChild(container);
      return this.ui.body;
   }

   buildFoot() {
      const div = document.createElement('div');
      div.className = 'item item-red';
      this.ui.foot.appendChild(div);
      return this.ui.foot;
   }
}
