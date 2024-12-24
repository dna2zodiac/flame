const iFs = require('fs');
const iPath = require('path');
const iCrypto = require('crypto');

function FsReaddir(path) {
   return new Promise((r, e) => {
      iFs.readdir(path, (err, list) => {
         if (err) return e(err); else r(list);
      });
   });
}

function FsMkdir(path) {
   return new Promise((r, e) => {
      iFs.mkdir(path, { recursive: true }, (err) => {
         if (err) return e(err); else r();
      });
   });
}

function FsExists(path) {
   return new Promise((r, e) => {
      iFs.stat(path, (err, _stat) => {
         if (err) {
            if (err.code === 'ENOENT') return r(false);
            return e(err);
         }
         r(true);
      });
   });
}

function FsOpen(path, mode) {
   return new Promise((r, e) => {
      iFs.open(path, mode || 'r', (err, fd) => {
         if (err) return e(err); else r(fd);
      });
   });
}

function FsRead(fd, length) {
   return new Promise((r, e) => {
      const buf = Buffer.alloc(length);
      iFs.read(fd, { buffer: buf, length }, (err, n, raw) => {
         if (err) return e(err);
         if (raw.length === n) r(raw); else r(raw.slice(0, n));
      });
   });
}

function FsWrite(fd, data) {
   return new Promise((r, e) => {
      iFs.write(fd, data, (err, _n, _raw) => {
         if (err) return e(err); else r();
      });
   });
}

function FsClose(fd) {
   return new Promise((r, e) => {
      iFs.close(fd, (err) => {
         if (err) return e(err); else r();
      });
   });
}

function FsStat(path) {
   return new Promise((r, e) => {
      iFs.stat(path, (err, stat) => {
         if (err) {
            if (err.code === 'ENOENT') return r(null);
            return e(err);
         } else r(stat);
      });
   });
}

function FsLstat(path) {
   return new Promise((r, e) => {
      iFs.lstat(path, (err, stat) => {
         if (err) {
            if (err.code === 'ENOENT') return r(null);
            return e(err);
         } else r(stat);
      });
   });
}

function FsReadFile(path) {
   return new Promise((r, e) => {
      iFs.readFile(path, (err, data) => {
         if (err) {
            if (err.code === 'ENOENT') return r(null);
            return e(err);
         } else r(data);
      });
   });
}

function FsWriteFile(path, data) {
   return new Promise((r, e) => {
      iFs.writeFile(path, data, (err) => {
         if (err) return e(err); else r();
      });
   });
}

function FsHash(path) {
   return new Promise((r, e) => {
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
      input.on('error', (err) => e(err))
   });
}

function FsMv(path, newpath) {
   return new Promise((r, e) => {
      iFs.rename(path, newpath, (err) => {
         if (err) return e(err); else r();
      });
   });
}

function FsRm(path) {
   return new Promise((r, e) => {
      iFs.unlink(path, (err) => {
         if (err) return e(err); else r();
      });
   });
}

function FsRmdir(path) {
   return new Promise((r, e) => {
      iFs.rmdir(path, (err) => {
         if (err) return e(err); else r();
      });
   });
}

async function FsRm_r(path) {
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

async function FsRm_up(path) {
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

module.exports = {
   FsReaddir,
   FsMkdir,
   FsExists,
   FsOpen,
   FsRead,
   FsWrite,
   FsClose,
   FsStat,
   FsLstat,
   FsReadFile,
   FsWriteFile,
   FsHash,
   FsMv,
   FsRm,
   FsRmdir,
   FsRm_r,
   FsRm_up,
};
