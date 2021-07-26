import {ElemAppendText, ElemEmpty, ElemIcon} from '../logic/util';
import {DataClient} from '../logic/api';

/*
<div class="item-thin">
   <a class="folder-fold-btn"></a><span>{item-name}</span>
   <div class="item-container folder">
   </div>
</div>
 */
class FolderNode {
   ui = {
      self: document.createElement('div'),
      fold: document.createElement('a'),
      name: document.createElement('span'),
      items: document.createElement('div')
   }
   name: string = '';
   path: string = '';
   children: any = {};
   state: string = 'none'; // none -> loading -> loaded/error

   constructor(name: string, path: string) {
      this.name = name;
      this.path = path;
      this.Render();
   }

   Render() {
      this.ui.self.className = 'item-thin';
      this.ui.fold.className = 'folder-fold-btn';
      this.ui.fold.setAttribute('data-path', this.path);
      this.ui.items.className = 'item-container folder';
      this.ui.items.style.display = 'none';
      this.ui.self.appendChild(this.ui.fold);
      this.ui.self.appendChild(this.ui.name);
      this.ui.self.appendChild(this.ui.items);
      ElemAppendText(this.ui.name, this.name);
   }

   GetDom() { return this.ui.self; }
   Dispose() {}

   IsFolded() { return this.ui.items.style.display === 'none'; }
   ChildrenReset() { ElemEmpty(this.ui.items); }
   ChildrenLoading() {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.className = 'spin spin-sm';
      div.appendChild(span);
      ElemAppendText(div, ' Loading ...');
      this.ChildrenReset();
      this.ui.items.appendChild(div);
      return div;
   }
   ChildrenError(err: any) {
      const div = document.createElement('div');
      div.className = 'item-thin item-red';
      div.appendChild(ElemIcon('img/exclamation.svg', 14, 14));
      ElemAppendText(div, err || 'Unknown Error');
      this.ChildrenReset();
      this.ui.items.appendChild(div);
      return div;
   }
   AddItem(node: FolderNode) {
      this.ui.items.appendChild(node.GetDom());
      return node.GetDom();
   }
   AddFileItem(name: string, url: string) {
      const div = document.createElement('a');
      div.className = 'item-thin';
      div.href = url;
      ElemAppendText(div, name);
      this.ui.items.appendChild(div);
      return div;
   }
   AsyncFold() {
      this.ui.items.style.display = 'none';
      this.ui.fold.classList.remove('active');
      return Promise.resolve(true);
   }
   AsyncUnfold() {
      this.ui.fold.classList.add('active');
      this.ui.items.style.display = 'block';
      if (this.state !== 'none' && this.state !== 'error') {
         // loading, loaded
         return Promise.resolve(true);
      }
      const that = this;
      this.state = 'loading';
      this.ChildrenLoading();
      return new Promise((r: any, e: any) => {
         DataClient.Project.GetDirectoryContents(that.path).Req().then(
            (result: any) => {
               that.ChildrenReset();
               if (!result || !result.length) {
                  that.state = 'error';
                  return r(false);
               }
               result.forEach((item: any) => {
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
            (err: any) => {
               that.ChildrenError(err);
               that.state = 'error';
               r(false);
            }
         );
      });
   }
}

export class FolderTree {
   self: HTMLElement;
   opt: any;
   root: FolderNode;
   taskQueue: any;

   constructor(dom: HTMLElement, opt: any) {
      this.self = dom;
      this.opt = opt || {};
      // none -> loading -> loaded
      //               \--> error
      this.root = new FolderNode('', '/');
      this.root.ui.self = <any>this.self;
      this.root.ui.items = <any>this.self;
      this.root.ChildrenReset();
      this.taskQueue = [];

      const that = this;
      this.root.ui.self.addEventListener('click', (evt: any) => {
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

   GetDom() { return this.self; }
   LocateNode(path: string): FolderNode {
      if (!path || !path.endsWith('/')) return null;
      let node = this.root;
      const parts = path.split('/');
      // /path/to/folder/ -> '', 'path', 'to', 'folder', ''
      parts.shift();
      parts.pop();
      while (node && parts.length) {
         const name = parts.shift();
         node = node.children[name + '/'];
      }
      return node;
   }
   AsyncExpandTo(path: string) {
      const that = this;
      return new Promise((r: any, e: any) => {
         let lastNode: any = null;
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
            parts.forEach((name: string) => {
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
                  let ch: any = null;
                  if (name) {
                     // file item
                     ch = (lastNode.children[name] || <any>{}).dom;
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

         function runLoadingTask(task: any) {
            let node = that.LocateNode(task.base);
            if (!node) return e('cannot load: ' + task.path);
            node = node.children[task.name];
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
                  (ok: boolean) => { if (ok) runLoadingTasks(); else e('cannot load: ' + task.path); },
                  () => { e('cannot load: ' + task.path); }
               );
            }

            function waitForNodeLoaded(node: any) {
               if (node.state === 'loaded') {
                  runLoadingTasks();
               } else if (node.state === 'error') {
                  return e('failed: ' + node.path);
               }
               setTimeout(waitForNodeLoaded, 100, node);
            }
         }
      });
   }
};

