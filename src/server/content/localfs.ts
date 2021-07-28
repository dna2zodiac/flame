import {IContentProvider} from './interface';

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
      const list = await iUtil.fileOp.readdir(realPath);
      const r: string[] = [];
      for (let i = 0, n = list.length; i < n; i ++){
         const name = list[i];
         const rp = iPath.join(realPath, name);
         const st = await iUtil.fileOp.stat(rp).catch(
            (err: any) => {}
         );
         if (!st) return;
         if (st.isDirectory()) {
            let full = name + '/';
            if (combine) {
               let fullrp = rp;
               let items: any = await this.getDirectoryItems(fullrp);
               while (items && items.length === 1 && items[0].endsWith('/')) {
                  fullrp = iPath.join(fullrp, items[0].split('/')[0]);
                  full += items[0];
                  items = await this.getDirectoryItems(fullrp);
               }
            }
            r.push(full);
         } else {
            r.push(name);
         }
      }
      return r;
   }
}
