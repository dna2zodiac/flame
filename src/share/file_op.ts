const iFs = require('fs');
const iPath = require('path');
const iCrypto = require('crypto');

export async function FsReaddir(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.readdir(path, (err: any, list: string[]) => {
         if (err) return e(err); else r(list);
      });
   });
}

export async function FsMkdir(path: string): Promise<any> {
   return new Promise(async (r: any, e: any) => {
      const parent = iPath.dirname(path);
      // at root folder like /, c:\
      if (parent === path) return r();
      try {
         await FsMkdir(parent);
      } catch (err: any)  {
         throw err;
      }
      if (await FsExists(path)) {
         const pathStat = await FsStat(path);
         if (!pathStat.isDirectory()) return e('invalid path');
         return r();
      }
      iFs.mkdir(path, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsExists(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.stat(path, (err: any, _stat: any) => {
         if (err) {
            if (err.code === 'ENOENT') return r(false);
            return e(err);
         }
         r(true);
      });
   });
}

export async function FsOpen(path: string, mode: string = 'r'): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.open(path, mode, (err: any, fd: number) => {
         if (err) return e(err); else r(fd);
      });
   });
}

export async function FsRead(fd: number, length: number): Promise<any> {
   return new Promise((r: any, e: any) => {
      const buf = Buffer.alloc(length);
      iFs.read(fd, { buffer: buf, length }, (err: any, n: number, raw: any) => {
         if (err) return e(err);
         if (raw.length === n) r(raw); else r(raw.slice(0, n));
      });
   });
}

export async function FsWrite(fd: number, data: Buffer): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.write(fd, data, (err: any, _n: number, _raw: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsClose(fd: number): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.close(fd, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsStat(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.stat(path, (err: any, stat: any) => {
         if (err) return e(err); else r(stat);
      });
   });
}

export async function FsLstat(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.lstat(path, (err: any, stat: any) => {
         if (err) return e(err); else r(stat);
      });
   });
}

export async function FsReadFile(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.readFile(path, (err: any, data: any) => {
         if (err) {
            if (err.code === 'ENOENT') return r(null);
            return e(err);
         } else r(data);
      });
   });
}

export async function FsWriteFile(path: string, data: any): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.writeFile(path, data, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsHash(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      const input = iFs.createReadStream(path);
      const hash = iCrypto.createHash('sha256');
      input.on('readable', () => {
         const data = input.read();
         if (data) {
            hash.update(data);
         } else {
            input.close();
            r(hash.digest('hex'));
         }
      });
      input.on('error', (err: any) => e(err))
   });
}

export async function FsMv(path: string, newpath: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.rename(path, newpath, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsRm(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.unlink(path, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsRmdir(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.rmdir(path, (err: any) => {
         if (err) return e(err); else r();
      });
   });
}

export async function FsRm_r(path: string): Promise<any> {
   const stat = await FsLstat(path);
   if (stat.isDirectory()) {
      const items = await FsReaddir(path);
      for (let i = 0, n = items.length; i < n; i++) {
         const item = items[i];
         await FsRm_r(iPath.join(path, item));
      }
      await FsRmdir(path);
   } else {
      await FsRm(path);
   }
}

export async function FsRm_up(path: string): Promise<any> {
   // rm -r path
   // (.parent.children.length === 0) rmdir .parent
   await FsRm_r(path);
   let parent = iPath.dirname(path), lastParent = path;
   while (parent !== lastParent) {
      const items = await FsReaddir(parent);
      if (items.length === 0) {
         await FsRmdir(parent);
         lastParent = parent;
         parent = iPath.dirname(parent);
      } else {
         lastParent = parent;
      }
   }
}

