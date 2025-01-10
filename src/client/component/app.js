const {Env} = require('../logic/global');
const {HashL} = require('../logic/hash');
const {BreadCrumb} = require('./breadcrumb');
const {ElemEmpty, ElemFlash, GetOS} = require('../logic/util');
const {DataClient} = require('../logic/api');
const {SideNavSearcherTab} = require('./sidenav/searcher');
const {SideNavBrowserTab} = require('./sidenav/browser');
const {SideNavBookmarkTab} = require('./sidenav/bookmark');
const {SideNavAnalyzerTab} = require('./sidenav/analyzer');
const {SideNavTeamTab} = require('./sidenav/team');
const {SideNavSettingsTab} = require('./sidenav/settings');
const {SourceCodeViewer} = require('./editor');

const GlobalShared = {};
window.FlameApp = GlobalShared;

function AppIconButton(name, imgSrc) {
   this.ui = {
      self: document.createElement('div'),
      btn: document.createElement('button')
   };
   this.events = {};
   let img = document.createElement('img');
   img.src = imgSrc;
   this.ui.btn.className = 'nav-icon-btn';
   this.ui.btn.title = name;
   this.ui.btn.setAttribute('data-tab', name);
   this.ui.btn.appendChild(img);
   this.ui.self.appendChild(this.ui.btn);
}
AppIconButton.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() { this.OnClick(null); },

   OnClick: function(fn) {
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
   },

   Name: function() {
      return this.ui.btn.getAttribute('data-tab');
   },
   IsActive: function() {
      return this.ui.btn.classList.contains('active');
   },
   Active: function() {
      this.ui.btn.classList.add('active');
   },
   Inactive: function() {
      this.ui.btn.classList.remove('active');
   },
};

function AppIconNav() {
   this.ui = {
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
   this.tab = null;
   this.ui.self.className = 'app-icon-nav';
}
AppIconNav.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {
      this.ui.btn.forEach(btn => {
         btn.Dispose();
      });
   },

   Touch: function(name) {
      const that = this;
      this.tab = null;
      this.ui.btn.forEach(btn => {
         if (btn.Name() === name && !btn.IsActive()) {
            btn.Active();
            that.tab = btn.Name();
         } else {
            btn.Inactive();
         }
      });
   },
   Tab: function() {
      return this.tab;
   },
};

function AppSideNav() {
   const that = this;
   this.ui = {
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
   this.tab = null;
   this.ui.self.className = 'side-container full-h scrollable-no';
   this.ui.self.style.width = '300px';
   Object.keys(this.ui.tab).forEach((name) => {
      const tab = that.ui.tab[name];
      this.ui.self.appendChild(tab.GetDom());
   });
   this.Hide();
}
AppSideNav.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   Show: function() {
      // TODO: if screen too small,
      //       get out of parent div and become position=fixed
      this.ui.self.style.display = 'block';
   },
   Hide: function() {
      this.ui.self.style.display = 'none';
   },

   Touch: function(name) {
      const that = this;
      const cur = this.tab;
      this.tab = null;
      Object.keys(this.ui.tab).forEach((name0) => {
         const tab = that.ui.tab[name0];
         tab.Hide();
         if (cur !== name && name0 === name) {
            tab.Show();
            that.tab = name;
         }
      });
      if (this.tab) {
         this.Show();
      } else {
         this.Hide();
      }
   },
   Tab: function() {
      return this.tab;
   },
};

function AppMainView() {
   this.ui = {
      self: document.createElement('div'),
      nav: new BreadCrumb(),
      view: document.createElement('div')
   };
   this.ui.self.className = 'flex11-auto flex-w0';
   const div = document.createElement('div');
   div.className = 'flex-frame flex-column';
   this.ui.view.className = 'flex11-auto flex-h0';
   div.appendChild(this.ui.nav.GetDom());
   this.ui.nav.Render('/');
   this.ui.view.innerHTML = '';
   div.appendChild(this.ui.view);
   this.ui.self.appendChild(div);
   // TODO: main view render
}
AppMainView.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},
};

function BodyConnector() {
   this.lastHash = {};
   this.editor = null;
   this.components = {};
}
BodyConnector.prototype = {
   Bind: function(nav, side, view) {
      this.components.nav = nav;
      this.components.side = side;
      this.components.view = view;

      // expose APIs to global
      // XXX: are there security concerns?
      GlobalShared.component = Object.assign({}, this.components);
      GlobalShared.component.editor = this.editor;

      nav.ui.btn.forEach(btn => {
         nav.ui.self.appendChild(btn.GetDom());
         btn.OnClick(evt => {
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
      stab.ui.box.share.addEventListener('click', onClickShare);
      onHashChange();
      return this;

      function onPressEnterForSearch(evt) {
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
         that.onSearch(query);
      }

      function onClickShare() {
         const stab = that.components.side.ui.tab.Search;
         stab.Share();
      }

      function onClickBreadcrumb(evt) {
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
   }, // Bind

   editorGotoLine: function(lineMark) {
      const that = this;
      if (!this.editor) return;
      if (!this.editor.ScrollToLine) return;
      if (!this.editor.LineHighlight) return;
      const hashL = new HashL(lineMark);
      this.editor.ScrollToLine(...(hashL.GetRange() || []));
      this.editor.LineHighlight(-1, -1);
      hashL.GetRaw().forEach(ab => {
         that.editor.LineHighlight(ab[0], ab[1], true);
      });
   },

   browserTabExpandTo: function(path) {
      const that = this;
      const btab = this.components.side.ui.tab.Browse;
      btab.tree.opt.switchToBrowseTab = btab.tree.opt.switchToBrowseTab || (() => {
         const tab = that.components.side.Tab();
         if (tab && tab !== 'Browse') {
            return false;
         }
         if (!tab) {
            that.components.nav.Touch('Browse');
            that.components.side.Touch('Browse');
         }
         return true;
      });
      btab.tree.opt.highlightItem = btab.tree.opt.highlightItem || (elem => {
         that.browserTabScrollTo(elem);
         ElemFlash(elem);
      });
      btab.tree.AsyncExpandTo(path);
   },

   browserTabScrollTo: function(elem) {
      if (this.components.side.Tab() !== 'Browse') return;
      const side = this.components.side.ui.self;
      const btabDiv = this.components.side.ui.tab.Browse.GetDom();
      const btabCnt = this.components.side.ui.tab.Browse.GetTreeContainer();
      const top = elem.offsetTop - side.offsetTop - (btabDiv.offsetHeight - btabCnt.offsetHeight);
      const top0 = btabCnt.scrollTop;
      const h = elem.offsetHeight;
      const h0 = btabCnt.offsetHeight;
      const x = btabCnt.scrollLeft;
      if (top0 > top) {
         btabCnt.scrollTo(x, top);
      } else if (top0 + h0 - h < top) {
         let y = top - h0 + h;
         if (y < 0) y = 0;
         else if (y > top) y = top;
         btabCnt.scrollTo(x, y);
      }
   },

   breadcrumbSetTo: function(path) {
      this.components.view.ui.nav.Render(path);
   },

   onView: function(path, opt) {
      if (!opt) opt = {};
      if (this.editor) this.editor.Dispose();
      ElemEmpty(this.components.view.ui.view);
      const req = DataClient.Project.GetFileContents(path).Req();
      const that = this;
      req.then(obj => {
         if (obj.binary) {
            // TODO: render not support file view
         } else {
            that.editor = new SourceCodeViewer({
               onClickLineNumber: (linenumber, keyOn) => {
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
            GlobalShared.component.editor = that.editor;
            that.components.view.ui.view.appendChild(that.editor.GetDom());
            that.editor.Render(obj.data);

            // TODO: async here; if load multiple files in a short time,
            //       it may be messy; need cancelable action
            let cmd;
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
            case '.pl':
               cmd = 'perl'; break;
            }
            if (cmd) {
               Env.worker.Call(
                  'editor.highlight',
                  { cmd: cmd, text: obj.data }
               ).then(res => {
                  console.log(res.id, res);
                  that.editor.SetStyle({
                     '.flame-editor-string': { color: '#32598b' },
                     '.flame-editor-comment': { color: 'green' },
                     '.flame-editor-regex': { color: '#8b3263' },
                     '.flame-editor-import-file': { color: '#32598b' },
                  });
                  that.editor.RenderSyntax(res.tokens);
               });
            }
         }
      }, (err) => {
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
   },

   onSearch: function(query) {
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
   },

   parseHash: function() {
      const parts = window.location.hash.split('#');
      parts.shift();
      const obj = {};
      obj.path = parts[0];
      parts.forEach(part => {
         const kv = part.split('=');
         obj[decodeURIComponent(kv[0] || '.')] = (
            decodeURIComponent(kv[1] || '')
         );
      });
      return obj;
   },

   buildHash: function(changes) {
      const obj = Object.assign(this.parseHash(), changes);
      const path = obj.path;
      delete obj.path;
      let hash = '#' + path;
      Object.keys(obj).forEach((key) => {
         if (!obj[key]) return;
         hash += (
            '#' + encodeURIComponent(key) + '=' +
            encodeURIComponent(obj[key])
         );
      });
      return hash;
   },

   extName: function(path, n) {
      if (!path) return '';
      const parts = path.split('.');
      if (parts.length === 1) return '';
      n = n || 1;
      let ed = parts.length;
      let st = parts.length - n;
      if (st < 1) st = 1;
      return '.' + parts.slice(st, ed).join('.');
   },
};

function AppFrame() {
   this.ui = {
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
   const flameDebug = {};
   flameDebug.body = bodyConnector;
   flameDebug.frame = this;
   window.flameDebug = flameDebug;
}
AppFrame.prototype = {
   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   buildHead: function() {
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
   },

   buildBody: function() {
      this.ui.body.className = 'flex11-auto flex-h0';
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
   },

   buildFoot: function() {
      const div = document.createElement('div');
      div.className = 'item item-red';
      this.ui.foot.appendChild(div);
      return this.ui.foot;
   },
}

module.exports = {
   AppFrame,
};
