import { FsReaddir, FsExists, FsReadFile } from '../../file_op';
import { LineReader } from '../../large_file';
import { getHashDir, getTrigramDir } from './search_indexer';

const iPath = require('path');

const IGNORE = ['list.json', 'ri'];

function shuffle(list: any[]) {
   if (!list || !list.length) return;
   const n = list.length;
   let m = ~~(n/2);
   while (m--) {
      const i = ~~(Math.random() * n);
      const j = ~~(Math.random() * n);
      if (i !== j) {
         const tmp = list[i];
         list[i] = list[j];
         list[j] = tmp;
      }
   }
}

function st(a: number[], b: number[], x: number) {
   // sorted a, b; check any(b[j] - a[i] = x)
   let i = 0, j = 0;
   while (i < a.length && j < b.length) {
      const A = a[i], B = b[j];
      if (B - A === x) return true;
      if (B - A < x) {
         j ++;
      } else {
         i ++;
      }
   }
   return false;
}

export async function TrigramSearch(query: string, metaRoot: string, opt: any): Promise<any> {
   metaRoot = iPath.resolve(metaRoot || '.');
   opt = opt || {};
   const ids = await TrigramSearchCandidate(query, metaRoot, opt);
   return await transformHashIdToPath(ids, metaRoot);
}

export async function TrigramSearchCandidate(query: string, metaRoot: string, opt: any): Promise<any> {
   metaRoot = iPath.resolve(metaRoot || '.');
   opt = opt || {};
   const r: any[] = [];
   const N = opt.N || 1000;
   const indexDir = iPath.join(metaRoot, '_index');
   const trigRoot = iPath.join(indexDir, '3gram'); 

   // TODO: ignore case
   if (query.length > 3) {
      const n = query.length-3;
      const headP = iPath.join(getTrigramDir(query.substring(0, 3), trigRoot), 'ri');
      const tailP = iPath.join(getTrigramDir(query.substring(n, n+3), trigRoot), 'ri');
      const headF = new LineReader(headP);
      const tailF = new LineReader(tailP);
      await headF.Open();
      await tailF.Open();
      let L1ix = -1, L2ix = -1, L1id = -1, L2id = -1;
      let L1next = true, L2next = true;
      let L1 = await headF.NextLine();
      let L2 = await tailF.NextLine();
      while (r.length < N && L1 !== null && L2 !== null) {
         if (!L1) { L1 = await headF.NextLine(); L1next = true; continue; }
         if (!L2) { L2 = await tailF.NextLine(); L2next = true; continue; }
         if (L1next) {
            L1ix = L1.indexOf(' ');
            if (L1ix < 0) { L1 = await headF.NextLine(); continue; }
            L1id = parseInt(L1.substring(0, L1ix), 10);
            L1next = false;
         }
         if (L2next) {
            L2ix = L2.indexOf(' ');
            if (L2ix < 0) { L2 = await tailF.NextLine(); continue; }
            L2id = parseInt(L2.substring(0, L2ix), 10);
            L2next = false;
         }
         if (L1id === L2id) {
            const L1ids = JSON.parse(L1.substring(L1ix+1));
            const L2ids = JSON.parse(L2.substring(L2ix+1));
            if (st(L1ids, L2ids, n)) r.push(L1id);
            L1 = await headF.NextLine();
            L1next = true;
            L2 = await tailF.NextLine();
            L2next = true;
         } else if (L1id > L2id) {
            L2 = await tailF.NextLine();
            L2next = true;
         } else /* L1id < L2id */ {
            L1 = await headF.NextLine();
            L1next = true;
         }
      }
      await headF.Close();
      await tailF.Close();
   } else if (query.length === 3) {
      const trigDir = getTrigramDir(query, trigRoot);
      const trigP = iPath.join(trigDir, 'ri');
      await readRiHashIdList(trigP, r, N);
   } else if (query.length === 2) {
      const trigDir = getTrigramDir(query, trigRoot);
      const items = (await FsReaddir(trigDir)).filter(
         (name: string) => !IGNORE.includes(name)
      );
      shuffle(items);
      while (r.length < N && items.length) {
         const name = items.shift();
         const trigP = iPath.join(trigDir, name, 'ri');
         await readRiHashIdList(trigP, r, N - r.length);
      }
   } else if (query.length === 1) {
      const trigDir = getTrigramDir(query, trigRoot);
      const items = (await FsReaddir(trigDir)).filter(
         (name: string) => !IGNORE.includes(name)
      );
      shuffle(items);
      while (r.length < N && items.length) {
         const name = items.shift();
         const subpath = iPath.join(trigDir, name);
         const subitems = (await FsReaddir(subpath)).filter(
            (name: string) => !IGNORE.includes(name)
         );
         shuffle(subitems);
         while (r.length < N && subitems.length) {
            const subname = subitems.shift();
            const trigP = iPath.join(trigDir, name, subname, 'ri');
            await readRiHashIdList(trigP, r, N - r.length);
         }
      }
   }
   return r;
}

async function readRiHashIdList(riP: string, r: any[], N: number): Promise<number> {
   if (!(await FsExists(riP))) return 0;
   const riF = new LineReader(riP);
   await riF.Open();
   let line: string;
   let count = 0;
   while (
      r.length < N &&
      (line = await riF.NextLine()) !== null
   ) {
      if (!line) continue;
      const ix = line.indexOf(' ');
      if (ix < 0) continue;
      const id = parseInt(line.substring(0, ix), 10);
      if (r.indexOf(id) >= 0) continue;
      r.push(id);
      count ++;
   }
   await riF.Close();
   return count;
}

async function transformHashIdToPath(r: any[], metaRoot: string): Promise<string[]> {
   const items: string[] = [];
   const indexDir = iPath.join(metaRoot, '_index');
   const listP = iPath.join(indexDir, 'list.json');
   const list = JSON.parse((await FsReadFile(listP)) || '[]');
   for (let i = 0, n = r.length; i < n; i++) {
      const id = r[i];
      const hash = list[id];
      if (!hash) continue;
      const hashP = getHashDir(metaRoot, hash);
      const pathListP = iPath.join(hashP, 'list.json');
      const pathList = JSON.parse((await FsReadFile(pathListP)) || '[]');
      pathList.forEach((x: string) => items.push(x));
   }
   return items;
}
