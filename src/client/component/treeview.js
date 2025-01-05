const {ElemAppendText, ElemEmpty, ElemIcon} = require('../logic/util');
const {DataClient} = require('../logic/api');

/*
<div class="item-thin">
   <a class="folder-fold-btn"></a><span>{item-name}</span>
   <div class="item-container folder">
   </div>
</div>
 */
function FolderNode(name, path) {
   this.ui = {
      self: document.createElement('div'),
      fold: document.createElement('a'),
      name: document.createElement('span'),
      items: document.createElement('div')
   }
   this.name = name;
   this.path = path;
   children = {};
   state = 'none'; // none -> loading -> loaded/error
   this.Render();
}
FolderNode.prototype = {
   Render: function() {
      this.ui.self.className = 'item-thin';
      this.ui.fold.className = 'folder-fold-btn';
      this.ui.fold.setAttribute('data-path', this.path);
      this.ui.items.className = 'item-container folder';
      this.ui.items.style.display = 'none';
      this.ui.self.appendChild(this.ui.fold);
      this.ui.self.appendChild(this.ui.name);
      this.ui.self.appendChild(this.ui.items);
      ElemAppendText(this.ui.name, this.name);
   },

   GetDom: function() { return this.ui.self; },
   Dispose: function() {},

   IsFolded: function() { return this.ui.items.style.display === 'none'; },
   ChildrenReset: function() { ElemEmpty(this.ui.items); },
   ChildrenLoading: function() {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.className = 'spin spin-sm';
      div.appendChild(span);
      ElemAppendText(div, ' Loading ...');
      this.ChildrenReset();
      this.ui.items.appendChild(div);
      return div;
   },
   ChildrenError: function(err) {
      const div = document.createElement('div');
      div.className = 'item-thin item-red';
      div.appendChild(ElemIcon('img/exclamation.svg', 14, 14));
      ElemAppendText(div, err || 'Unknown Error');
      this.ChildrenReset();
      this.ui.items.appendChild(div);
      return div;
   },
   AddItem: function(node) {
      this.ui.items.appendChild(node.GetDom());
      return node.GetDom();
   },
   AddFileItem: function(name, url) {
      const div = document.createElement('a');
      div.className = 'item-thin';
      div.href = url;
      ElemAppendText(div, name);
      this.ui.items.appendChild(div);
      return div;
   },
   AsyncFold: function() {
      this.ui.items.style.display = 'none';
      this.ui.fold.classList.remove('active');
      return Promise.resolve(true);
   },
   AsyncUnfold: function() {
      this.ui.fold.classList.add('active');
      this.ui.items.style.display = 'block';
      if (this.state !== 'none' && this.state !== 'error') {
         // loading, loaded
         return Promise.resolve(true);
      }
      const that = this;
      this.state = 'loading';
      this.ChildrenLoading();
      return new Promise((r, e) => {
         DataClient.Project.GetDirectoryContents(that.path).Req().then(
            (result) => {
               that.ChildrenReset();
               if (!result || !result.length) {
                  that.state = 'error';
                  return r(false);
               }
               result = result.sort((a, b) => {
                  if (!a && !b) return 0;
                  if (!a || !a.name) return 1;
                  if (!b || !b.name) return -1;
                  const namea = a.name.toLowerCase();
                  const nameb = b.name.toLowerCase();
                  const pab = namea.endsWith('/');
                  const pbb = nameb.endsWith('/');
                  if (pab && pbb) {
                     if (namea > nameb) return 1;
                     return -1;
                  } else if (pab && !pbb) {
                     return -1;
                  } else if (!pab && pbb) {
                     return 1;
                  } else {
                     if (namea > nameb) return 1;
                     return -1;
                  }
               });
               result.forEach((item) => {
                  if (!item.name) return;
                  if (item.name.endsWith('/')) {
                     const node = new FolderNode(
                        item.name.substring(0, item.name.length-1),
                        that.path + item.name
                     );
                     that.AddItem(node);
                     that.children[item.name] = node;
                  } else {
                     const div = that.AddFileItem(item.name, '#' + that.path + item.name);
                     that.children[item.name] = {
                        file: true,
                        dom: div
                     };
                  }
               });
               that.state = 'loaded';
               r(true);
            },
            (err) => {
               that.ChildrenError(err);
               that.state = 'error';
               r(false);
            }
         );
      });
   },
};

function FolderTree(dom, opt) {
   this.self = dom;
   this.opt = opt || {};
   // none -> loading -> loaded
   //               \--> error
   this.root = new FolderNode('', '/');
   this.root.ui.self = this.self;
   this.root.ui.items = this.self;
   this.root.ChildrenReset();
   this.taskQueue = [];

   const that = this;
   this.root.ui.self.addEventListener('click', evt => {
      var el = evt.target;
      if (el.classList.contains('folder-fold-btn')) {
         const node = that.LocateNode(el.getAttribute('data-path'));
         if (!node) return;
         if (node.IsFolded()) {
            node.AsyncUnfold();
         } else {
            node.AsyncFold();
         }
      }
   });
   // TODO: handle dispose
}
FolderTree.prototype = {
   GetDom: function() { return this.self; },
   LocateNode: function(path) {
      if (!path || !path.endsWith('/')) return null;
      let node = this.root;
      const parts = path.split('/');
      // /path/to/folder/ -> '', 'path', 'to', 'folder', ''
      parts.shift();
      parts.pop();
      while (node && parts.length) {
         const name = parts.shift();
         const name0 = name + '/';
         const next = node.children[name0];
         if (next) {
            node = next;
         } else {
            // e.g. main/com/java/
            //      main/
            const nodeMem = node;
            let possible = Object.keys(node.children).filter(
               (full) => full.startsWith(name0)
            );
            let match = name0;
            node = null;
            while (possible.length > 0 && parts.length > 0) {
               const subname = parts.shift();
               match += subname + '/';
               possible = possible.filter(
                  (full) => full.startsWith(match)
               );
               if (possible[0] === match) {
                  node = nodeMem.children[match];
                  break;
               }
            }
            // main/ -> match = main/com/java/
         }
      }
      return node;
   },
   AsyncExpandTo: function(path) {
      const that = this;
      return new Promise((r, e) => {
         let lastNode = null;
         waitForRootLoaded();

         function waitForRootLoaded() {
            if (that.root.state === 'loaded') {
               generateLoadingTasks();
               return;
            } else if (that.root.state === 'error') {
               return e('failed to get project list.');
            }
            setTimeout(waitForRootLoaded, 100);
         }

         function generateLoadingTasks() {
            that.taskQueue = [];
            const parts = path.split('/');
            // e.g. /path/to/folder/ -> path, to, folder
            //      /path/to/file -> path, to
            parts.shift();
            parts.pop();
            parts.forEach((name) => {
               const last = that.taskQueue[that.taskQueue.length-1] || { path: '/' };
               that.taskQueue.push({ base: last.path, path: last.path + name + '/', name: name + '/' });
            });
            runLoadingTasks();
         }

         function runLoadingTasks() {
            if (!that.taskQueue.length) {
               if (that.opt.switchToBrowseTab) {
                  that.opt.switchToBrowseTab();
               }
               if (lastNode) {
                  const name = path.split('/').pop()
                  let ch = null;
                  if (name) {
                     // file item
                     ch = (lastNode.children[name] || {}).dom;
                  } else {
                     // folder item
                     ch = lastNode.GetDom();
                  }
                  if (ch && that.opt.highlightItem) {
                     that.opt.highlightItem(ch);
                  }
                  lastNode = null;
               }
               return r();
            }
            runLoadingTask(that.taskQueue.shift());
         }

         function runLoadingTask(task) {
            let node = that.LocateNode(task.base);
            if (!node) return e('cannot load: ' + task.path);
            if (task.name in node.children) {
               node = node.children[task.name];
            } else {
               const possible = that.taskQueue.filter(x => x.base === task.base + task.name);
               // should only one here
               const taskX = possible[0];
               if (taskX) {
                  taskX.base = task.base;
                  taskX.name = task.name + taskX.name;
                  // e.g. folder path combined like /main/com/java
                  runLoadingTasks();
                  return;
               }
               // XXX: how to select when user choose /main/com
               //      but the folder path combined as /main/com/java
               //      /main/com -> /main/com/java, or /main/com -> /, or <not found>
            }
            if (!node) return e('not found: ' + task.name + ' in ' + task.base);
            lastNode = node;
            if (node.state === 'loaded') {
               node.AsyncUnfold().then(() => {
                  runLoadingTasks();
               });
            } else if (node.state === 'loading') {
               waitForNodeLoaded(node);
            } else {
               node.AsyncUnfold().then(
                  (ok) => { if (ok) runLoadingTasks(); else e('cannot load: ' + task.path); },
                  () => { e('cannot load: ' + task.path); }
               );
            }

            function waitForNodeLoaded(node) {
               if (node.state === 'loaded') {
                  runLoadingTasks();
               } else if (node.state === 'error') {
                  return e('failed: ' + node.path);
               }
               setTimeout(waitForNodeLoaded, 100, node);
            }
         }
      });
   }, // AsyncExpandTo
};

module.exports = {
   FolderTree,
};
