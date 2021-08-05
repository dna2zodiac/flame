const iFs = require('fs');

const CACHE_N = 1024 * 1024;

export class LineReader {
   opt: any;
   filename: string;
   fd: number;
   buf: Buffer;
   eof: boolean;
   cache: any[];

   constructor(filename: string, opt: any = null) {
      this.opt = opt || {};
      this.filename = filename;
      this.fd = -1;
      this.buf = Buffer.alloc(this.opt.cacheN || CACHE_N);
      this.eof = false;
      this.cache = [Buffer.alloc(0)];
   }

   Eof(): boolean {
      return this.eof;
   }

   async Open(): Promise<any> {
      if (this.fd >= 0) return Promise.resolve();
      return new Promise((r: any, e: any) => {
         iFs.open(this.filename, (err: any, fd: number) => {
            if (err) {
               if (err.code === 'ENOENT') {
                  this.eof = true;
                  r();
               }
               return e(err);
            }
            this.fd = fd;
            r();
         });
      });
   }

   async NextLine(): Promise<any> {
      await this.Open();
      if (this.cache && this.cache.length > 1) {
         return Promise.resolve(this.cache.shift());
      }
      if (this.eof) return Promise.resolve(null);
      await this.fillCache();
      if (this.cache.length <= 1) {
         if (!this.cache[0] || this.cache[0].length === 0) {
            // empty file
            this.eof = true;
            return Promise.resolve(null);
         }
         // TODO: deal with too long line
         //       if change `if` to `while`,
         //       do N times to allow cache size * N length line
         return Promise.reject('too long line');
      }
      return Promise.resolve(this.cache.shift());
   }

   async fillCache(): Promise<any> {
      return new Promise((r: any, e: any) => {
         const lastLine = this.cache.pop();
         iFs.read(this.fd, { buffer: this.buf, length: this.buf.length }, (err: any, n: number, raw: Buffer) => {
            if (err) return e(err);
            if (n < this.buf.length) {
               this.eof = true;
            }
            if (n === 0) return r();
            const buf = Buffer.concat([lastLine, raw.slice(0, n)])
            const lines = buf.toString().split('\n');
            const incompleteLine = lines.pop();
            lines.forEach((line) => this.cache.push(line));
            const postN = Buffer.from(incompleteLine).length;
            this.cache.push(buf.slice(buf.length - postN, buf.length));
            r();
         });
      });
   }

   async Close(): Promise<any> {
      if (this.fd >= 0) {
         return new Promise((r: any, e: any) => {
            iFs.close(this.fd, (err: any) => {
               if (err) return e(err); else r();
            });
         });
      }
      return Promise.resolve();
   }
}
