import {
   FsReadFile, FsWriteFile, FsRm_up, FsRm, FsMkdir, FsExists,
   FsMv, FsOpen, FsWrite, FsClose
} from '../../file_op';
import {LineReader} from '../../large_file';
import {/*GenInMemWordIndex, */GenInMemTrigramIndex} from '../../search/indexer';

const iPath = require('path');

/* special export; friend = ./search_searcher */
export function getHashDir(metaRoot: string, hash: string): string {
   let parts = [];
   for (let i = 0, n = hash.length; i < n; i += 4) {
      parts.push(hash.substring(i, i+4));
   }
   return iPath.join(metaRoot, ...parts);
}

const TRANS_CHAR: any = {
   '!': '%21', '*': '%2a', '`': '%60',
   '@': '%40', '#': '%23', '$': '%24',
   '^': '%5e', '&': '%26', '|': '%7c',
   '\\': '%5c', '{': '%7b', '}': '%7d',
   '[': '%5b', ']': '%5d', '<': '%3c',
   '>': '%3e', '?': '%3f', '/': '%2f',
   '=': '%3d', '+': '%2b', '.': '%2e',
   ':': '%3a', '(': '%28', ')': '%29',
   '\t': '%09', '\n': '%0a', '\r': '%0d',
   ' ': '%20', '\x00': '%00', '\x01': '%01',
   '\x02': '%02', '\x03': '%03', '\x04': '%04',
   '\x05': '%05', '\x06': '%06', '\x07': '%07',
   '\x08': '%08', '\x0b': '%0b', '\x0c': '%0c',
   '\x0e': '%0e', '\x0f': '%0f', '\x10': '%10',
   '\x11': '%11', '\x12': '%12', '\x13': '%13',
   '\x14': '%14', '\x15': '%15', '\x16': '%16',
   '\x17': '%17', '\x18': '%18', '\x19': '%19',
   '\x1a': '%1a', '\x1b': '%1b', '\x1c': '%1c',
   '\x1d': '%1d', '\x1e': '%1e', '\x1f': '%1f',
};
/* special export; friend = ./search_searcher */
export function getTrigramDir(tri: string, rootDir: string) {
   return iPath.join(rootDir, ...tri.split('').map(
      (x: string) => TRANS_CHAR[x] || x
   ));
}

/*
   file-level:
   - TODO: /metadir/<hash>/word.json
   - /metadir/<hash>/3gram.json
   - /metadir/<hash>/list.json
 */

// TODO: currently we deal with simple case
//       everything store in one json

// obj: p(path), p_(absPath),
//      h(oldHash), h_(currentHash),
//      a(action), m(mtime), b(isBinary)
export async function IncFileLv(obj: any, metaRoot: string) {
   if (obj.b) return; // do not index binary file
   const outHashDir = getHashDir(metaRoot, obj.h_);
   const listP = iPath.join(outHashDir, 'list.json');
   const listRaw = await FsReadFile(listP);
   if (listRaw) {
      const list = JSON.parse(listRaw);
      if (list.includes(obj.p)) return;
      list.push(obj.p);
      await FsWriteFile(listP, JSON.stringify(list));
   } else {
      const raw = await FsReadFile(obj.p_);
      if (!raw) return;
      const text = raw.toString();
      // TODO: deal with large file
      await FsWriteFile(listP, JSON.stringify([obj.p]));
      const trigP = iPath.join(outHashDir, '3gram.json');
      await FsWriteFile(trigP, JSON.stringify(
         await GenInMemTrigramIndex(text, null)
      ));
      /* const wordP = iPath.join(outHashDir, 'word.json');
      await FsWriteFile(wordP, JSON.stringify(
         await GenInMemWordIndex(text, null)
      ));*/
   }
}

export async function DecFileLv(obj: any, metaRoot: string) {
   // TODO: notice that currently it is not thread-safe
   //       do we want to use task queue?
   const outHashDir = getHashDir(metaRoot, obj.h);
   const listP = iPath.join(outHashDir, 'list.json');
   const list = JSON.parse((await FsReadFile(listP)) || '[]');
   const i = list.indexOf(obj.p);
   if (i >= 0) {
      if (list.length === 1) {
         await FsRm_up(outHashDir);
      } else {
         list.splice(i, 1);
         await FsWriteFile(listP, JSON.stringify(list));
      }
   }
}

/*
   project-level:
   - TODO: /metadir/_index/word.json
   - /metadir/_index/3gram/...
   - /metadir/_index/list.json  [ hash, null, hash ]
                                  id=0        id=2
   project-level should run before file-level
   so that it can fetch old file-level index
*/
export async function IncProjectLv(obj: any, metaRoot: string) {
   const outIndexDir = iPath.join(metaRoot, '_index');
   const outListP = iPath.join(outIndexDir, 'list.json');
   const outTrigP = iPath.join(outIndexDir, '3gram');
   const outHashDir = getHashDir(metaRoot, obj.h_);
   const listP = iPath.join(outHashDir, 'list.json');
   if (!(await FsExists(listP))) {
      await IncFileLv(obj, metaRoot);

      await FsMkdir(outIndexDir);
      const outList = JSON.parse((await FsReadFile(outListP)) || '[]');
      let ix = outList.indexOf(obj.h_);
      if (ix >= 0) return;
      ix = outList.indexOf(null);
      if (ix < 0) {
         ix = outList.length;
         outList.push(obj.h_);
      } else {
         outList[ix] = obj.h_;
      }
      await FsWriteFile(outListP, JSON.stringify(outList));

      const trigP = iPath.join(outHashDir, '3gram.json');
      const trig = JSON.parse((await FsReadFile(trigP)) || '{}');
      const tris = Object.keys(trig)
      for (let i = 0, n = tris.length; i < n; i++) {
         const tri = tris[i];
         const outTriP = getTrigramDir(tri, outTrigP);
         await FsMkdir(outTriP);
         const outTriRiP = iPath.join(outTriP, 'ri');
         const indexLine = `${ix} ${JSON.stringify(trig[tri])}`;
         await mergeIndexLine(outTriRiP, indexLine);
      }
   }
}

export async function DecProjectLv(obj: any, metaRoot: string) {
   const outIndexDir = iPath.join(metaRoot, '_index');
   const outListP = iPath.join(outIndexDir, 'list.json');
   const outTrigP = iPath.join(outIndexDir, '3gram');
   const outHashDir = getHashDir(metaRoot, obj.h);
   const listP = iPath.join(outHashDir, 'list.json');
   if (await FsExists(listP)) {
      const list = JSON.parse((await FsReadFile(listP)) || '[]');
      if (!list.includes(obj.p)) return;
      if (list.length > 1) return;
      const outList = JSON.parse((await FsReadFile(outListP)) || '[]');
      const ix = outList.indexOf(obj.h_);
      if (ix < 0) return;
      outList[ix] = null;
      await FsWriteFile(outListP, JSON.stringify(outList));

      const trigP = iPath.join(outHashDir, '3gram.json');
      const trig = JSON.parse((await FsReadFile(trigP)) || '{}');
      const tris = Object.keys(trig)
      for (let i = 0, n = tris.length; i < n; i++) {
         const tri = tris[i];
         const outTriP = getTrigramDir(tri, outTrigP);
         const outTriRiP = iPath.join(outTriP, 'ri');
         if (!(await FsExists(outTriRiP))) continue;
         await removeIndexLine(outTriRiP, ix);
      }
   }
}

async function mergeIndexLine(targetP: string, line: string) {
   if (!line) return;
   let ix = line.indexOf(' ');
   if (ix < 0) return;
   const id = parseInt(line.substring(0, ix), 10);
   const target_P = targetP + '_';
   const targetF = new LineReader(targetP);
   const targetFd = await FsOpen(target_P, 'w+');
   await targetF.Open();
   let ready = false;
   let L: string;
   while ((L = await targetF.NextLine()) !== null) {
      if (!L) continue;
      ix = L.indexOf(' ');
      if (ix < 0) return;
      const Lid = parseInt(L.substring(0, ix), 10);
      if (ready) {
         await FsWrite(targetFd, Buffer.from(L + '\n'));
      } else if (Lid > id) {
         ready = true;
         await FsWrite(targetFd, Buffer.from(line + '\n'));
         await FsWrite(targetFd, Buffer.from(L + '\n'));
      } else if (Lid === id) {
         ready = true;
         await FsWrite(targetFd, Buffer.from(line + '\n'));
      } else {
         await FsWrite(targetFd, Buffer.from(L + '\n'));
      }
   }
   if (!ready) await FsWrite(targetFd, Buffer.from(line + '\n'));
   await targetF.Close();
   await FsClose(targetFd);
   await FsMv(target_P, targetP);
}

async function removeIndexLine(targetP: string, id: number) {
   if (!(await FsExists(targetP))) return;
   const target_P = targetP + '_';
   const targetF = new LineReader(targetP);
   const targetFd = await FsOpen(target_P, 'w+');
   await targetF.Open();
   let L: string;
   let count = 0;
   while ((L = await targetF.NextLine()) !== null) {
      if (!L) continue;
      const ix = L.indexOf(' ');
      if (ix < 0) return;
      const Lid = parseInt(L.substring(0, ix), 10);
      if (Lid !== id) {
         await FsWrite(targetFd, Buffer.from(L + '\n'));
         count ++;
      }
   }
   await targetF.Close();
   await FsClose(targetFd);
   if (count) {
      await FsMv(target_P, targetP);
   } else {
      await FsRm_up(targetP)
   }
}
