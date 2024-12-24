const iFs = require('fs');

const CACHE_N = 1024 * 1024;

function LineReader(filename, opt) {
   this.opt = opt || {};
   this.filename = filename;
   this.fd = -1;
   this.buf = Buffer.alloc(this.opt.cacheN || CACHE_N);
   this.eof = false;
   this.cache = [Buffer.alloc(0)];
}
LineReader.prototpye = {
   Eof: function() {
      return this.eof;
   },

   Open: function() {
      const that = this;
      if (this.fd >= 0) return Promise.resolve();
      return new Promise((r, e) => {
         iFs.open(this.filename, (err, fd) => {
            if (err) {
               if (err.code === 'ENOENT') {
                  that.eof = true;
                  r();
               }
               return e(err);
            }
            that.fd = fd;
            r();
         });
      });
   },

   NextLine: async function() {
      await this.Open();
      if (this.cache && this.cache.length > 1) {
         return this.cache.shift();
      }
      if (this.eof) return null;
      await this.fillCache();
      if (this.cache.length <= 1) {
         if (!this.cache[0] || this.cache[0].length === 0) {
            // empty file
            this.eof = true;
            return null;
         }
         // TODO: deal with too long line
         //       if change `if` to `while`,
         //       do N times to allow cache size * N length line
         throw 'too long line';
      }
      return this.cache.shift();
   },

   fillCache: function() {
      return new Promise((r, e) => {
         const lastLine = this.cache.pop();
         iFs.read(this.fd, { buffer: this.buf, length: this.buf.length }, (err, n, raw) => {
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
            if (this.eof) {
               const remains = this.cache.pop();
               this.cache.push(remains.toString());
               this.cache.push(Buffer.alloc(0));
            }
            r();
         });
      });
   },

   Close: function() {
      if (this.fd >= 0) {
         return new Promise((r, e) => {
            iFs.close(this.fd, (err) => {
               if (err) return e(err); else r();
            });
         });
      }
      return Promise.resolve();
   },
};

module.exports = {
   LineReader,
};
