import {BasicTextParser} from '../lang/common';
import {LineReader} from '../large_file';
import {FsReaddir, FsMkdir, FsStat, FsHash, FsOpen, FsWrite, FsClose} from '../file_op';

const iPath = require('path');

/*
 index possible process:
 - list all searchable files
   - record mtime for every file (for incremental indexing)
   - foreach file, do GenInMemWordIndex and GenInMemTrigramIndex
   -               store (path, word-index, 3gram-index) info into disk
   - /outdir/hash/word.json
   - /outdir/hash/3gram.json
   - /outdir/hash/list.json
   - /outdir/meta.json { mtime }
   - /outdir/file      { path: mtime }
   - /outdir/new       { path: mtime }
   - /outdir/changelist
 - merge word-index and 3gram-index to project level
 - merge project-level index to global level
 */

export const IGNORE_DIRS = ['.git', '.flame'];

export function GenProjectIndex(srcRoot: string, outDir: string, opt: any): any {
   const error: any[] = [];
   const fileList: any = {};
   srcRoot = iPath.resolve(srcRoot);
   outDir = iPath.resolve(outDir);
   return new Promise(async (r: any, e: any) => {
      await FsMkdir(outDir);
      await scanLatest();
      await detectChanges();
      await indexFiles();
      // TODO: handle the array `error`
      await mergeIndexes(outDir);
      r();
   });

   async function scanLatest() {
      // scan current files
      const queue = ['/'];
      const outNewFd = await FsOpen(iPath.join(outDir, 'new'), 'w+');
      while (queue.length) {
         const item = queue.shift();
         const path = iPath.join(srcRoot, item);
         try {
            const list = await FsReaddir(path);
            for (let i = 0, n = list.length; i < n; i++) {
               const name = list[i];
               const subpath = iPath.join(path, name);
               const next = subpath.substring(srcRoot.length);
               // TODO: try...catch...
               const stat = await FsStat(subpath);
               if (stat.isDirectory()) {
                  if (IGNORE_DIRS.includes(name)) continue;
                  queue.push(next + iPath.sep);
               } else {
                  await FsWrite(outNewFd, Buffer.from(JSON.stringify({
                     p: next, m: stat.mtimeMs
                  }) + '\n'));
               }
            }
         } catch (err: any) {
            // TODO: handle error
         }
      }
      await FsClose(outNewFd);
   }

   async function detectChanges(): Promise<any> {
      // TODO: diff(/outdir/file, /outdir/new)
      //       out: { p: path, a: action(a=added,d=deleted,u=updated) }
      //         --> /outdir/changelist
   }

   async function indexFiles(): Promise<any> {
      // TODO: read(/outdir/changelist)
      //       update index for each file
   }

   // TODO: use in indexFiles
   async function indexFileItem(path: string): Promise<any> {
      const item = path.substring(srcRoot.length);
      const hash = await FsHash(path);
      const outHashDir = getIndexDirname(hash);
      /*if (await FsExists(outHashDir)) {
         // TODO
         // possible the same contents we meet
      } else {
      }*/

      function getIndexDirname(hash: string): string {
         let parts = [];
         for (let i = 0, n = hash.length; i < n; i += 4) {
            parts.push(hash.substring(i, i+4));
         }
         return iPath.join(outDir, ...parts);
      }
   }
   async function mergeIndexes(path: string): Promise<any> {
      console.log('output:', path);
   }
}

export function GenInMemWordIndex(text: string, opt: any): any {
   // index = { token: count }
   // TODO: limit |{token}|
   const index: any = {};
   const parser = new BasicTextParser();
   const tokens = parser.Parse(text, {
      noKeepStop: true,
      nonAsciiWord: true
   }).forEach((token: string) => {
      if (token.length > 100) return; // filter out too long token
      index[token] = (index[token] || 0) + 1;
   });
   return index;
}

export function GenInMemTrigramIndex(text: string, opt: any): any {
   // index = { trigram: [position] }
   // TODO: limit |{trigram}|, |{position}|
   const index: any = {};
   const n = text.length;
   for (let i = 0; i <= n-3; i++) {
      const trigram = text.substring(i, i+3);
      if (!index[trigram]) index[trigram] = [];
      index[trigram].push(i);
   }
   return index;
}

console.log('debugLine; remove after the module complete');
GenProjectIndex(process.argv[2], process.argv[3], null).then(() => console.log('done'), (err: any) => console.error(err));
