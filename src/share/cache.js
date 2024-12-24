const { FsReadFile, FsWriteFile, FsRm_up } = require('./file_op');

function FileCache(cap, encodeFn, decodeFn) {
   this.cap = cap;
   this.cur = 0;
   this.cache = {/*
      key=path
      key: { data, size, dirty, score }
   */};
   this.encodeFn = encodeFn;
   this.decodeFn = decodeFn;
}
FileCache.prototype = {
   Get: async function(key) {
      let item = this.cache[key];
      if (!item) {
         const raw = await FsReadFile(key);
         if (!raw) return null;
         const data = this.decodeFn(raw);
         if (!data) return null;
         const ok = await this.Put(key, data, raw.length);
         if (!ok) return null;
         item = this.cache[key];
      }
      item.score ++;
      return item.data;
   },

   Put: async function(key, data, deltaSize) {
      if (deltaSize > this.cap) return false;
      if (deltaSize > 0 && this.cur >= this.cap) {
         await this.gc(deltaSize);
      }
      let obj = this.cache[key];
      if (obj) {
         obj.data = data;
         obj.size += deltaSize;
         obj.dirty = true;
      } else {
         obj = { data, size: deltaSize, dirty: false, score: 0 };
         this.cache[key] = obj;
      }
      this.cur += deltaSize;
      return true;
   },

   Clean: async function() {
      const keys = Object.keys(this.cache);
      for (let i = 0, n = keys.length; i < n; i++) {
         const key = keys[i];
         const item = this.cache[key];
         if (!item) continue;
         if (item.dirty) await this.flush(key);
         delete this.cache[key];
      }
   },

   gc: async function(needSize) {
      // rank with score and wipe out the ones with low score
      const keys = Object.keys(this.cache).sort((a: any, b: any) => {
         if (a.score === b.score) {
            return b.size - a.size;
         }
         return a.score - b.score;
      });
      let released = 0;
      for (let i = 0, n = keys.length; i < n; i++) {
         const key = keys[i];
         const item = this.cache[key];
         if (!item) continue;
         if (item.dirty) await this.flush(key);
         delete this.cache[key];
         released += item.size;
         if (released >= needSize) return;
      }
   },

   flush: async function(key) {
      const obj = this.cache[key];
      if (!obj) return;
      const cooked = this.encodeFn(obj.data);
      if (!cooked) {
         await FsRm_up(key);
         this.cur -= obj.size;
         delete this.cache[key];
         return;
      }
      await FsWriteFile(key, cooked);
      obj.dirty = false;
      obj.score = 0;
   },
};

module.exports = {
   FileCache,
};
