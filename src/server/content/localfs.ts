import {IContentProvider} from './interface';
import {IGNORE_DIRS} from '../../share/env';

const iUtil = require('../framework/util');
const iPath = require('path');
const iFile = require('fs');

export class LocalFSContentProvider implements IContentProvider {
   baseDir: string;

   constructor(baseDir: string) {
      this.baseDir = iPath.resolve(baseDir);
   }

   async GetFileContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const realPath = iPath.join(
         this.baseDir, project, ...path.split('/')
      );
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

   async GetProjectList(): Promise<any> {
      const list = await this.getDirectoryItems(this.baseDir, false);
      return list.filter(
         // TODO: more filter
         (name: string) => name.endsWith('/')
      ).map(
         (name: string) => ({ name })
      );
   };

   async GetDirectoryContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const realPath = iPath.join(
         this.baseDir, project, ...path.split('/')
      );
      const list = await this.getDirectoryItems(realPath);
      // TODO: filter special folder like .git, ...
      return list.map((name: string) => ({ name }));
   }

   async getDirectoryItems(realPath: string, combine: boolean = true): Promise<any> {
      if (!(await iUtil.fileOp.exist(realPath))) {
         throw new Error('invalid path');
      }
      const stat = await iUtil.fileOp.stat(realPath);
      if (!stat.isDirectory()) throw new Error('invalid path');
      const list = await this.readDir(realPath, false);
      if (combine) {
      }
      for (let i = 0, n = list.length; i < n; i ++){
         let name = list[i];
         if (!name.endsWith('/')) continue;
         let rp = iPath.join(realPath, name);
         let r = await this.readDir(rp, true);
         while (r.length === 1 && r[0].endsWith('/')) {
            rp = iPath.join(rp, r[0]);
            name += r[0];
            r = await this.readDir(rp, true);
         }
         list[i] = name;
      }
      return list;
   }
   async readDir(realPath: string, combine: boolean): Promise<any> {
      const list = await iUtil.fileOp.readdir(realPath);
      const r: string[] = [];
      for (let i = 0, n = list.length; i < n; i ++){
         const name = list[i];
         const rp = iPath.join(realPath, name);
         const st = await iUtil.fileOp.stat(rp).catch(
            (err: any) => {}
         );
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
            if (r.length > 1) return r;
            // if readdir get first file item, cannot combine
            if (!r[0].endsWith('/')) return r;
         }
      }
      return r;
   }
}
