import {
   FsReadFile, FsWriteFile, FsRm_up, FsRm
} from '../../file_op';
import {GenInMemWordIndex, GenInMemTrigramIndex} from '../../search/indexer';

const iPath = require('path');

function getHashDir(metaRoot: string, hash: string): string {
   let parts = [];
   for (let i = 0, n = hash.length; i < n; i += 4) {
      parts.push(hash.substring(i, i+4));
   }
   return iPath.join(metaRoot, ...parts);
}

/*
   file-level:
   - /metadir/<hash>/word.json
   - /metadir/<hash>/3gram.json
   - /metadir/<hash>/list.json
   project-level:
   - /metadir/.index/word.json
   - /metadir/.index/3gram.json
   - /metadir/.index/list.json
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
      const wordP = iPath.join(outHashDir, 'word.json');
      const trigP = iPath.join(outHashDir, '3gram.json');
      // TODO: deal with large file
      await FsWriteFile(listP, JSON.stringify([obj.p]));
      await FsWriteFile(wordP, JSON.stringify(
         await GenInMemWordIndex(text, null)
      ));
      await FsWriteFile(trigP, JSON.stringify(
         await GenInMemTrigramIndex(text, null)
      ));
   }
}

// list.json []
export async function DecFileLv(obj: any, metaRoot: string) {
   // TODO: notice that currently it is not thread-safe
   //       do we want to use task queue?
   const outHashDir = getHashDir(metaRoot, obj.h);
   const listP = iPath.join(outHashDir, 'list.json');
   const list = JSON.parse(await FsReadFile(listP));
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

export async function IncProjectLv(obj: any, metaRoot: string) {
}

export async function DecProjectLv(obj: any, metaRoot: string) {
}
