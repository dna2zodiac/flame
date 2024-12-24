const {IGNORE_DIRS} = require('../../share/env');

const iUtil = require('../framework/util');
const iPath = require('path');
const iFile = require('fs');

function HtmlEncode(text) {
   text = text.replace(/&/g, '&amp;');
   text = text.replace(/</g, '&lt;');
   text = text.replace(/>/g, '&gt;');
   return text;
}

class LocalFSContentProvider {
   constructor(baseDir) {
      this.baseDir = iPath.resolve(baseDir);
   }

   async GetFileContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const basePath = await iUtil.fileOp.realpath(iPath.join(this.baseDir, project));
      const realPath = await iUtil.fileOp.realpath(iPath.join(basePath, ...path.split('/')));
      if (!realPath.startsWith(basePath)) {
         throw new Error('invalid path');
      }
      if (!(await iUtil.fileOp.exist(realPath))) {
         throw new Error('invalid path');
      }
      const stat = await iUtil.fileOp.stat(realPath);
      if (stat.isDirectory()) throw new Error('invalid path');
      const obj = { binary: false, data: '' };
      const blob = (await iUtil.fileOp.read(realPath)).toString();
      if (blob.indexOf('\x00') >= 0) obj.binary = true;
      obj.data = blob;
      return obj;
   }

   async GetMetaData(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const projectPath = iPath.resolve(
         iPath.join(this.baseDir, project)
      );
      const realPath = iPath.resolve(
         iPath.join(projectPath, ...path.split('/'))
      );
      if (!realPath.startsWith(projectPath + iPath.sep)) {
         throw new Error('invalid path');
      }
      const metadataPath = iPath.resolve(iPath.join(
         this.baseDir, project, '.flame', ...path.split('/')
      ) + '.flame');
      // TODO: metadataPath escape check
      if (!(await iUtil.fileOp.exist(realPath))) {
         throw new Error('invalid path');
      }
      const obj = {};
      if (!(await iUtil.fileOp.exist(metadataPath))) {
         return obj;
      }
      const stat = await iUtil.fileOp.stat(realPath);
      if (stat.isDirectory()) {
         throw new Error('not supported yet');
      }
      const blob = Object.assign(
         obj, JSON.parse(await iUtil.fileOp.read(metadataPath))
      );
      return obj;
   }

   async GetProjectList() {
      const list = await this.getDirectoryItems(this.baseDir, false);
      return list.filter(
         // TODO: more filter
         (name) => name.endsWith('/')
      ).map(
         (name) => ({ name })
      );
   };

   async GetDirectoryContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const basePath = await iUtil.fileOp.realpath(iPath.join(this.baseDir, project));
      const realPath = await iUtil.fileOp.realpath(iPath.join(basePath, ...path.split('/')));
      if (!realPath.startsWith(basePath)) {
         throw new Error('invalid path');
      }
      const list = await this.getDirectoryItems(realPath);
      // TODO: filter special folder like .git, ...
      return list.map((name) => ({ name }));
   }

   async getDirectoryItems(realPath, combine) {
      if (!(await iUtil.fileOp.exist(realPath))) {
         throw new Error('invalid path');
      }
      const stat = await iUtil.fileOp.stat(realPath);
      if (!stat.isDirectory()) throw new Error('invalid path');
      const list = await this.readDir(realPath, false);
      for (let i = 0, n = list.length; i < n; i ++){
         let name = list[i];
         if (!name.endsWith('/')) continue;
         let rp = iPath.join(realPath, name);
         let r = await this.readDir(rp, true);
         while (combine && r.length === 1 && r[0].endsWith('/')) {
            rp = iPath.join(rp, r[0]);
            name += r[0];
            r = await this.readDir(rp, true);
         }
         list[i] = name;
      }
      return list;
   }
   async readDir(realPath, combine) {
      const list = await iUtil.fileOp.readdir(realPath);
      const r = [];
      for (let i = 0, n = list.length; i < n; i ++){
         const name = list[i];
         // NB: here we do not check if real path escape from base
         //     should guarantee in GetDirectoryContent
         const rp = await iUtil.fileOp.realpath(iPath.join(realPath, name));
         const st = await iUtil.fileOp.stat(rp).catch(err => {});
         if (!st) continue;
         if (st.isDirectory()) {
            if (IGNORE_DIRS.includes(name)) continue;
            let full = name + '/';
            r.push(full);
         } else {
            r.push(name);
         }
         if (combine) {
            // combine: /com/java/package/A.java
            //          |----------------| -> as one item
            // if readdir get 2 items, cannot combine
            if (r.length !== 1) return r;
            // if readdir get first file item, cannot combine
            if (!r[0].endsWith('/')) return r;
         }
      }
      return r;
   }
}

class LocalFSSearchProvider {
   constructor(content) {
      this.content = content;
   }

   async SearchProject (query, options) {
      options = options || {};
      const r = {
         type: 'project',
         items: [],
      };
      try {
         const regexp = new RegExp(query);
         r.items = await this.content.GetProjectList();
         r.items = r.items.filter((item) => regexp.test(item.name));
      } catch(_) { }
      r.items = r.items.map((item) => item.name).slice(0, 100);
      return r;
   }

   async SearchFile (query, options) {
      options = options || {};
      const r = {
         type: 'file',
         items: [],
      };
      try { new RegExp(query); } catch(_) { return r; }
      const regexp = new RegExp(query);
      const queue = (
         await this.content.GetProjectList()
      ).map((item) => ({
         project: item.name.substring(0, item.name.length-1),
         path: '/'
      }));
      while (queue.length && options.canceled) {
         const cur = queue.shift();
         if (regexp.test(cur.path)) r.items.push({ project: cur.project, path: cur.path });
         if (r.items.length >= 100) break;
         if (!cur.path.endsWith('/')) {
            continue;
         }
         const scope = await this.content.GetDirectoryContent(cur.project, cur.path, null);
         const order = [];
         for (let i = 0, n = scope.length; i < n; i++) {
            const item = scope[i];
            order.unshift({ project: cur.project, path: cur.path + item.name });
         }
         order.forEach((item) => queue.unshift(item));
      }
      return r;
   }

   async SearchContent (query, options) {
      options = options || {};
      const r = {
         type: 'content',
         items: [],
      };
      try { new RegExp(query); } catch(_) { return r; }
      const regexp = new RegExp(query);
      const queue = (
         await this.content.GetProjectList()
      ).map((item) => ({
         project: item.name.substring(0, item.name.length-1),
         path: '/'
      }));
      searchloop:
      while (queue.length && !options.canceled) {
         const cur = queue.shift();
         if (!cur.path.endsWith('/')) {
            const obj = await this.content.GetFileContent(cur.project, cur.path, null);
            if (obj.binary) continue;
            const lines = obj.data.split('\n');
            for (let i = 0, n = lines.length; i < n; i++) {
               const line = lines[i];
               if (!regexp.test(line)) continue;
               r.items.push({
                  project: cur.project, path: cur.path,
                  line: i+1, content: line
               });
               if (r.items.length >= 100) break searchloop;
            }
            continue;
         }
         const scope = await this.content.GetDirectoryContent(cur.project, cur.path, null);
         const order = [];
         for (let i = 0, n = scope.length; i < n; i++) {
            const item = scope[i];
            const path = cur.path + item.name;
            order.unshift({ project: cur.project, path: path });
         }
         order.forEach((item) => queue.unshift(item));
      }
      return r;
   }

   async Search (query, options) {
      const r = {
         matchQuery: query,
         items: [],
      };
      // XXX: ugly code here for involving canceled
      //      flag here
      const srProject = options.canceled?null:(await this.SearchProject(query, options));
      const srFile = options.canceled?null:(await this.SearchFile(query, options));
      const srContent = options.canceled?null:(await this.SearchContent(query, options));
      srProject && srProject.items.forEach((name) => {
         r.items.push({
            path: '/' + name, matches: []
         });
      });
      srFile && srFile.items.forEach((item) => {
         r.items.push({
            path: '/' + item.project + item.path,
            matches: [],
         });
      });
      srContent && srContent.items.forEach((item) => {
         const last = r.items[r.items.length - 1];
         const path = '/' + item.project + item.path;
         if (last && last.path === path) {
            last.matches.push({
               L: item.line, T: HtmlEncode(item.content),
            });
         } else {
            r.items.push({
               path: '/' + item.project + item.path,
               matches: [{
                  L: item.line, T: HtmlEncode(item.content),
               }],
            });
         }
      });
      return r;
   }
}

module.exports = {
   LocalFSContentProvider,
   LocalFSSearchProvider,
};
