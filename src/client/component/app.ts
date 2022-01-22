import {Env} from '../logic/global';
import {HashL} from '../logic/hash';
import {BreadCrumb} from './breadcrumb';
import {ElemEmpty, ElemFlash, GetOS} from '../logic/util';
import {DataClient} from '../logic/api';
import {SideNavSearcherTab} from './sidenav/searcher';
import {SideNavBrowserTab} from './sidenav/browser';
import {SideNavBookmarkTab} from './sidenav/bookmark';
import {SideNavAnalyzerTab} from './sidenav/analyzer';
import {SideNavTeamTab} from './sidenav/team';
import {SideNavSettingsTab} from './sidenav/settings';
import {SourceCodeViewer} from './editor';

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
            'click', this.events.onClick, false
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
         new AppIconButton('Bookmark', 'img/bookmark.svg'),
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
         Bookmark: new SideNavBookmarkTab(),
         Settings: new SideNavSettingsTab()
      }
   };
   tab: string = null;

   constructor () {
      this.ui.self.className = 'side-container full-h scrollable-no';
      this.ui.self.style.width = '300px';
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
      this.ui.nav.Render('/');
      this.ui.view.innerHTML = '';
      div.appendChild(this.ui.view);
      this.ui.self.appendChild(div);
      // TODO: main view render
   }

   GetDom() { return this.ui.self; }
   Dispose() {}
}

class BodyConnector {
   lastHash: any = {};
   editor: any = null;
   components: any = {};

   constructor() {}

   Bind(nav: AppIconNav, side: AppSideNav, view: AppMainView) {
      this.components.nav = nav;
      this.components.side = side;
      this.components.view = view;

      nav.ui.btn.forEach((btn: AppIconButton) => {
         nav.ui.self.appendChild(btn.GetDom());
         btn.OnClick((evt: any) => {
            const name = btn.Name();
            nav.Touch(name);
            side.Touch(name);
         });
      });

      const that = this;
      window.addEventListener('hashchange', onHashChange, false);
      this.components.view.ui.nav.GetDom().addEventListener(
         'click', onClickBreadcrumb, false
      );
      const stab = this.components.side.ui.tab.Search;
      stab.ui.box.query.addEventListener('keypress', onPressEnterForSearch);
      stab.ui.box.search.addEventListener('click', onClickSearch);
      onHashChange();
      return this;

      function onPressEnterForSearch(evt: any) {
         if (evt.key !== 'Enter') return;
         onClickSearch();
      }

      function onClickSearch() {
         const stab = that.components.side.ui.tab.Search;
         const query = stab.ui.box.query.value;
         if (!query) {
            stab.ui.box.query.focus();
            return;
         }
         window.location.hash = '#?' + encodeURIComponent(query);
      }

      function onClickBreadcrumb(evt: any) {
         if (evt.target.tagName.toLowerCase() === 'a') {
            evt.preventDefault();
            const path = evt.target.getAttribute('data-path');
            if (!path) return;
            that.browserTabExpandTo(path);
         }
      }

      function onHashChange() {
         const obj = that.parseHash();
         if (obj.path) {
            if (obj.path.startsWith('/')) {
               if (obj.path === that.lastHash.path) {
                  that.editorGotoLine(obj.L);
               } else {
                  that.browserTabExpandTo(obj.path);
                  if (that.editor) that.editor.Dispose();
                  ElemEmpty(view.ui.view);
                  that.breadcrumbSetTo(obj.path);
                  const pathparts = obj.path.split('/');
                  const path_basename = pathparts.pop();
                  pathparts.shift();
                  const path_project = pathparts.shift();
                  const path_dirname = pathparts.join('/');
                  document.title = `Flame - ${path_basename} @ ${path_project}:/${path_dirname}`;
                  if (!obj.path.endsWith('/')) {
                     that.onView(obj.path).then(() => {
                        that.editorGotoLine(obj.L);
                     }, () => { /* TODO: error */ });
                  }
               }
            } else if (obj.path.startsWith('?')) {
               // TODO: use #Q=... instead of #?... ?
               //       so that we can show file content meanwhile show query results
               //       e.g. #/path/to/file#Q=test
               const query = decodeURIComponent(obj.path.substring(1));
               document.title = `Flame - Search: ${query}`;
               that.onSearch(query);
            }
         }
         that.lastHash = obj;
      }
   }

   editorGotoLine(lineMark: string) {
      if (!this.editor) return;
      if (!this.editor.ScrollToLine) return;
      if (!this.editor.LineHighlight) return;
      const hashL = new HashL(lineMark);
      this.editor.ScrollToLine(...hashL.GetRange());
      this.editor.LineHighlight(-1, -1);
      hashL.GetRaw().forEach((ab: number[]) => {
         this.editor.LineHighlight(ab[0], ab[1], true);
      });
   }

   browserTabExpandTo(path: string) {
      const that = this;
      const btab = this.components.side.ui.tab.Browse;
      btab.tree.opt.switchToBrowseTab = btab.tree.opt.switchToBrowseTab || (() => {
         if (that.components.side.Tab() !== 'Browse') {
            that.components.nav.Touch('Browse');
            that.components.side.Touch('Browse');
         }
      });
      btab.tree.opt.highlightItem = btab.tree.opt.highlightItem || ((elem: any) => {
         that.browserTabScrollTo(elem);
         ElemFlash(elem);
      });
      btab.tree.AsyncExpandTo(path);
   }

   browserTabScrollTo(elem: any) {
      if (this.components.side.Tab() !== 'Browse') return;
      const side = this.components.side.ui.self;
      const btabDiv = this.components.side.ui.tab.Browse.GetDom();
      const top = elem.offsetTop - side.offsetTop;
      const top0 = btabDiv.scrollTop;
      const h = elem.offsetHeight;
      const h0 = btabDiv.offsetHeight;
      const x = btabDiv.scrollLeft;
      if (top0 > top) {
         btabDiv.scrollTo(x, top);
      } else if (top0 + h0 - h < top) {
         let y = top - h0 + h;
         if (y < 0) y = 0;
         else if (y > top) y = top;
         btabDiv.scrollTo(x, y);
      }
   }

   breadcrumbSetTo(path: string) {
      this.components.view.ui.nav.Render(path);
   }

   onView(path: string, opt: any = null): Promise<any> {
      if (!opt) opt = {};
      if (this.editor) this.editor.Dispose();
      ElemEmpty(this.components.view.ui.view);
      const req = DataClient.Project.GetFileContents(path).Req();
      const that = this;
      req.then((obj: any) => {
         if (obj.binary) {
            // TODO: render not support file view
         } else {
            that.editor = new SourceCodeViewer({
               onClickLineNumber: (linenumber: number, keyOn: any) => {
                  const hash = that.parseHash();
                  const hashL = new HashL(hash.L);
                  const ctrlOn = GetOS() === 'darwin'?keyOn.meta:keyOn.ctrl
                  if (ctrlOn) {
                     if (hashL.CheckCross(linenumber, linenumber+1)) {
                        hashL.DelRange(linenumber, linenumber+1);
                     } else {
                        hashL.AddRange(linenumber, linenumber+1);
                     }
                  } else if (keyOn.shift) {
                     const ab = hashL.GetRange();
                     if (ab) {
                        if (linenumber < ab[0]) {
                           hashL.AddRange(linenumber, ab[0]);
                        } else if (linenumber >= ab[1]) {
                           hashL.AddRange(ab[1], linenumber+1);
                        } else {
                           hashL.AddRange(ab[0], linenumber+1);
                        }
                     } else {
                        hashL.Reset();
                        hashL.AddRange(linenumber, linenumber+1);
                     }
                  } else {
                     const ab = hashL.GetRange();
                     hashL.Reset();
                     if (!ab || ab[0] !== linenumber || ab[1] !== linenumber+1) {
                        hashL.AddRange(linenumber, linenumber+1);
                     }
                  }
                  const lnstr = hashL.GetLstr();
                  window.location.hash = that.buildHash({ L: lnstr || null });
               }
            });
            that.components.view.ui.view.appendChild(that.editor.GetDom());
            that.editor.Render(obj.data);

            // TODO: async here; if load multiple files in a short time,
            //       it may be messy; need cancelable action
            let cmd: string;
            switch(that.extName(path)) {
            case '.c': case '.h':
               cmd = 'c'; break;
            case '.cc': case '.hh': case '.cpp': case '.hpp':
               cmd = 'cpp'; break;
            case '.java':
               cmd = 'java'; break;
            case '.py':
               cmd = 'python'; break;
            case '.go':
               cmd = 'golang'; break;
            case '.js': case '.ts':
               cmd = 'javascript'; break;
            case '.cs':
               cmd = 'csharp'; break;
            case '.css':
               cmd = 'css'; break;
            case '.rs':
               cmd = 'rust'; break;
            case '.kt':
               cmd = 'kotlin'; break;
            case '.rb':
               cmd = 'ruby'; break;
            }
            if (cmd) {
               Env.worker.Call(
                  'editor.highlight',
                  { cmd: cmd, text: obj.data }
               ).then((res: any) => {
                  console.log(res.id, res);
                  that.editor.SetStyle({
                     '.flame-editor-string': { color: '#32598b' },
                     '.flame-editor-comment': { color: 'green' },
                     '.flame-editor-regex': { color: '#8b3263' },
                  });
                  that.editor.RenderSyntax(res.tokens);
               });
            }
         }
      }, (err: any) => {
         const notification = document.createElement('span');
         if (err === 404) {
            notification.className = 'item item-red';
            notification.appendChild(document.createTextNode('Not Found'));
            that.components.view.ui.view.appendChild(notification);
         } else {
            notification.className = 'item item-red';
            notification.appendChild(document.createTextNode('Internal Error'));
            that.components.view.ui.view.appendChild(notification);
         }
      });
      return req;
   }

   onSearch(query: string): Promise<any> {
      const that =this;
      const stab = this.components.side.ui.tab.Search;
      stab.ui.box.query.value = query;
      const req = stab.Search(query);
      req.then(() => {
         if (that.components.side.Tab() !== 'Search') {
            that.components.nav.Touch('Search');
            that.components.side.Touch('Search');
         }
         ElemFlash(that.components.side.ui.tab.Search.ui.result);
      }, () => {});
      return req;
   }

   parseHash(): any {
      const parts = window.location.hash.split('#');
      parts.shift();
      const obj: any = {};
      obj.path = parts[0];
      parts.forEach((part: string) => {
         const kv = part.split('=');
         obj[decodeURIComponent(kv[0] || '.')] = (
            decodeURIComponent(kv[1] || '')
         );
      });
      return obj;
   }

   buildHash(changes: any): string {
      const obj = Object.assign(this.parseHash(), changes);
      const path = obj.path;
      delete obj.path;
      let hash = '#' + path;
      Object.keys(obj).forEach((key: string) => {
         if (!obj[key]) return;
         hash += (
            '#' + encodeURIComponent(key) + '=' +
            encodeURIComponent(obj[key])
         );
      });
      return hash;
   }

   extName(path: string, n: number = 1): string {
      if (!path) return '';
      const parts = path.split('.');
      if (parts.length === 1) return '';
      let ed = parts.length;
      let st = parts.length - n;
      if (st < 1) st = 1;
      return '.' + parts.slice(st, ed).join('.');
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

      const bodyConnector = new BodyConnector().Bind(
         this.ui.nav.icon,
         this.ui.nav.side,
         this.ui.view
      );

      // TODO: do we need to disable it in prod env?
      const flameDebug: any = {};
      flameDebug.body = bodyConnector;
      flameDebug.frame = this;
      const windowAny: any = <any>window;
      windowAny.flameDebug = flameDebug;
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
