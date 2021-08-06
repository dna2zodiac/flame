import {LineReader} from './large_file';
import {
   FsReaddir, FsMkdir, FsStat, FsHash,
   FsOpen, FsRead, FsWrite, FsClose,
   FsRm, FsMv, FsExists
} from './file_op';
import {IGNORE_DIRS} from './env';

import * as searchPlugin from './plugin/analyzer/search_indexer';

const iPath = require('path');

const ANALYSIS_PLUGINS: any[] = [
   /* { Inc, Dec, Post }
      Inc = (obj, metaRoot)
      Dec = (obj, metaRoot)
      Post = (metaRoot)
    */
   /* searchPlugin:
      project-level first, file-level then
    */
   {
      Inc: searchPlugin.IncProjectLv,
      Dec: searchPlugin.DecProjectLv,
      Post: searchPlugin.PostProjectLv
   },
   {
      Inc: searchPlugin.IncFileLv,
      Dec: searchPlugin.DecFileLv
   },
];

/*
 analyze process:
 - list all searchable files
   - record mtime for every file (for incremental indexing)
   - foreach file, do GenInMemWordIndex and GenInMemTrigramIndex
   -               store (path, word-index, 3gram-index) info into disk
   - /outdir/<hash>/word.json
   - /outdir/<hash>/3gram.json
   - /outdir/<hash>/list.json
   - /outdir/<hash>/...
   - /outdir/_cur        { m, p=path, h=hash }
   - /outdir/_new        { m, p }
      - /outdir/_newh    { m, p, h }
   - /outdir/_changelist { m, p, a=action, h, h_=(new hash) }; p_=(real absolute path)
   - /outdir/_index/...
 - analysis plugins like:
   - merge word-index and 3gram-index to project level
   - merge project-level index to global level
 */

export function AnalyzeProject(srcRoot: string, outDir: string, opt: any): any {
   const error: any[] = [];
   const fileList: any = {};
   srcRoot = iPath.resolve(srcRoot);
   outDir = iPath.resolve(outDir);
   return new Promise(async (r: any, e: any) => {
      await FsMkdir(outDir);
      await scanLatest();
      await detectChanges();
      await analyzeFiles();
      // TODO: handle the array `error`
      r();
   });

   async function scanLatest() {
      // scan current files
      // out: { p: path, m: mtime }
      const queue = ['/'];
      const outNewFd = await FsOpen(iPath.join(outDir, '_new'), 'w+');
      await scanDfs(srcRoot, outNewFd);
      await FsClose(outNewFd);
   }

   async function scanDfs(path: string, outFd: number): Promise<any> {
      try {
         const list = (await FsReaddir(path)).sort(
            (a: string, b: string) => {
               if (a < b) {
                  return -1;
               } else if (a > b) {
                  return 1;
               }
               return 0;
            }
         );
         for (let i = 0, n = list.length; i < n; i++) {
            const name = list[i];
            const subpath = iPath.join(path, name);
            const next = subpath.substring(srcRoot.length);
            // TODO: try...catch...
            const stat = await FsStat(subpath);
            if (stat.isDirectory()) {
               if (IGNORE_DIRS.includes(name)) continue;
               await scanDfs(subpath, outFd);
            } else {
               await FsWrite(outFd, Buffer.from(JSON.stringify({
                  p: next, m: stat.mtimeMs
               }) + '\n'));
            }
         }
      } catch(err: any) {
         throw err;
      }
   }

   async function detectChanges(): Promise<any> {
      // diff(/outdir/cur, /outdir/new)
      // out: { p: path, a: action(a=added,d=deleted,u=updated) }
      //   --> /outdir/changelist
      const oldP = iPath.join(outDir, '_cur');
      const newP = iPath.join(outDir, '_new');
      const outNewWithHashP = iPath.join(outDir, '_newh');
      const outP = iPath.join(outDir, '_changelist');
      const outFd = await FsOpen(outP, 'w+');
      const outNewWithHashFd = await FsOpen(outNewWithHashP, 'w+');
      const oldF = new LineReader(oldP);
      const newF = new LineReader(newP);
      // TODO: use try...catch... to wrap io operations
      await oldF.Open();
      await newF.Open();
      let oldL = await oldF.NextLine();
      let newL = await newF.NextLine();
      let nextOld = false, nextNew = false;
      // merge 2 files and get change list
      while (oldL !== null || newL !== null ) {
         nextOld = false;
         nextNew = false;
         if (oldL === null) {
            // all remains added
            if (newL.length) {
               const objNew = JSON.parse(newL);
               const hash = await getFileHash(objNew.p);
               await FsWrite(outNewWithHashFd, Buffer.from(
                  JSON.stringify(Object.assign({ h: hash }, objNew)) + '\n'
               ));
               await FsWrite(outFd, Buffer.from(
                  JSON.stringify(Object.assign({ a: 'a', h_: hash }, objNew)) + '\n'
               ));
            }
            nextNew = true;
         } else if (newL === null) {
            // all remains deleted
            if (oldL.length) {
               const objOld = JSON.parse(oldL);
               await FsWrite(outFd, Buffer.from(
                  JSON.stringify(Object.assign({ a: 'd' }, objOld)) + '\n'
               ));
            }
            nextOld = true;
         } else if (!oldL.length || !newL.length) {
            nextOld = !oldL.length;
            nextNew = !newL.length;
         } else {
            const objOld = JSON.parse(oldL);
            const objNew = JSON.parse(newL);
            if (objOld.p > objNew.p) {
               const hash = await getFileHash(objNew.p);
               await FsWrite(outNewWithHashFd, Buffer.from(
                  JSON.stringify(Object.assign({ h: hash }, objNew)) + '\n'
               ));
               await FsWrite(outFd, Buffer.from(
                  JSON.stringify(Object.assign({ a: 'a', h_: hash }, objNew)) + '\n'
               ));
               nextNew = true;
            } else if (objOld.p < objNew.p) {
               await FsWrite(outFd, Buffer.from(
                  JSON.stringify(Object.assign({ a: 'd' }, objOld)) + '\n'
               ));
               nextOld = true;
            } else {
               const hash = await getFileHash(objNew.p);
               await FsWrite(outNewWithHashFd, Buffer.from(
                  JSON.stringify(Object.assign({ h: hash }, objNew)) + '\n'
               ));
               if (objOld.m !== objNew.m) {
                  await FsWrite(outFd, Buffer.from(
                     JSON.stringify(Object.assign({ a: 'u', h_: hash }, objOld)) + '\n'
                  ));
               }
               nextOld = true;
               nextNew = true;
            }
         }
         if (nextOld) oldL = await oldF.NextLine();
         if (nextNew) newL = await newF.NextLine();
      }
      await FsClose(outFd);
      await FsClose(outNewWithHashFd);
      await oldF.Close();
      await newF.Close();
      await FsMv(outNewWithHashP, oldP);
      await FsRm(newP);
   }

   async function getFileHash(item: string): Promise<any> {
      return await FsHash(iPath.join(srcRoot, item));
   }

   async function analyzeFiles(): Promise<any> {
      // TODO: read(/outdir/changelist)
      //       for each file
      //       - index add/del/update
      const changeP = iPath.join(outDir, '_changelist');
      const changeF = new LineReader(changeP);
      await changeF.Open();
      let line: string;
      while ((line = await changeF.NextLine()) !== null) {
         if (!line) continue;
         const obj = JSON.parse(line);
         const path = iPath.join(srcRoot, obj.p);
         switch (obj.a) {
            case 'u':
               await removeFileItem(obj);
               await analyzeFileItem(obj);
               break;
            case 'd':
               await removeFileItem(obj);
               break;
            case 'a':
               await analyzeFileItem(obj);
               break;
            default:
               throw `unknown action type: ${obj.a}`;
         }
      }
      await changeF.Close();
      for (let i = 0, n = ANALYSIS_PLUGINS.length; i < n; i++) {
         const PostFn = ANALYSIS_PLUGINS[i].Post;
         PostFn && await PostFn(outDir);
      }
      await FsRm(changeP);
   }

   /*sync*/ function getMetaDirname(hash: string): string {
      let parts = [];
      for (let i = 0, n = hash.length; i < n; i += 4) {
         parts.push(hash.substring(i, i+4));
      }
      return iPath.join(outDir, ...parts);
   }

   async function isBinaryFile(path: string): Promise<any> {
      const fd = await FsOpen(path);
      const probe = (await FsRead(fd, 1024 * 1024)).toString();
      if (probe.indexOf('\x00') >= 0) return true;
      return false;
   }

   async function analyzeFileItem(obj: any): Promise<any> {
      const path = iPath.join(srcRoot, obj.p);
      const outHashDir = getMetaDirname(obj.h_);
      const isBinary = await isBinaryFile(path);
      console.log('analyze:', obj.p, isBinary);
      await FsMkdir(outHashDir);
      for (let i = 0, n = ANALYSIS_PLUGINS.length; i < n; i++) {
         const IncFn = ANALYSIS_PLUGINS[i].Inc;
         IncFn && await IncFn(Object.assign({
            p_: path, b: isBinary
         }, obj), outDir);
      }
   }

   async function removeFileItem(obj: any): Promise<any> {
      const path = iPath.join(srcRoot, obj.p);
      const outHashDir = getMetaDirname(obj.h);
      console.log('remove:', obj.p);
      if (await FsExists(outHashDir)) {
         for (let i = 0, n = ANALYSIS_PLUGINS.length; i < n; i++) {
            const DecFn = ANALYSIS_PLUGINS[i].Dec;
            DecFn && await DecFn(Object.assign({ p_: path }, obj), outDir);
         }
      }
   }
}
