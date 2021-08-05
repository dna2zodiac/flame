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

export async function FsReadFile(path: string): Promise<any> {
   return new Promise((r: any, e: any) => {
      iFs.readFile(path, (err: any, data: any) => {
         if (err) return e(err); else r(data);
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

