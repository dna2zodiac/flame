import {Env} from '../logic/global';

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
      const that = this;
      this.ui.btn.forEach((btn: AppIconButton) => {
         this.ui.self.appendChild(btn.GetDom());
         btn.OnClick((evt: any) => {
            that.Touch(btn.Name());
         });
      });
   }

   GetDom() { return this.ui.self; }
   Dispose() {
      this.ui.btn.forEach((btn: AppIconButton) => {
         btn.Dispose();
      });
   }

   Touch (name: string) {
      this.ui.btn.forEach((btn: AppIconButton) => {
         if (btn.Name() === name && !btn.IsActive()) {
            btn.Active();
         } else {
            btn.Inactive();
         }
      });
   }
}

class AppSideNav {
   ui = {
      self: document.createElement('div')
   };

   constructor () {
      this.ui.self.style.width = '300px';
      // TODO: side nav render
      this.ui.self.innerHTML = 'SideNav works!';
   }

   GetDom() { return this.ui.self; }
   Dispose() {}
}

class AppMainView {
   ui = {
      self: document.createElement('div')
   };

   constructor () {
      this.ui.self.className = 'flex-auto flex-w0';
      this.ui.self.innerHTML = 'MainView works!';
      // TODO: main view render
   }

   GetDom() { return this.ui.self; }
   Dispose() {}
}

export class AppFrame {
   ui = {
      self: document.createElement('div'),
      head: document.createElement('header'),
      body: document.createElement('body'),
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
