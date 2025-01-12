const i_path = require('path');
const i_fs = require('fs').promises;
const { IGNORE_DIRS } = require('../env');

async function collectDir(outbase, base, dir) {
   if (!dir) return;
   try {
      const rpath = dir.substring(base.length+1);
      console.log(`[I] collect info in ${base} at ${rpath} ...`);
      const list = await i_fs.readdir(dir);
      const outdir = rpath ? i_path.join(outbase, rpath) : null;
      // XXX: after we process real data, uncomment below line
      // if (outdir) await i_fs.mkdir(outdir);

      for (let i = 0, n = list.length; i < n; i++) {
         const name = list[i];
         if (IGNORE_DIRS.includes(name)) continue;
         const fn = i_path.join(dir, name);
         try {
            const stat = await i_fs.lstat(fn);
            if (stat.isFile()) {
               // TODO: analyze fn; extract tokens
               const rfpath = fn.substring(base.length+1);
               const outpath = outdir ? i_path.join(outdir, rfpath) : i_path.join(outbase, rfpath);
               // ....
               // XXX: after we process real data, remove below line
               console.log(`[I] analyze: /${rfpath} -> ${outpath}`);
            } else if (stat.isDirectory()) {
               await collectDir(outbase, base, fn);
            } else if (stat.isSymbolicLink()) {
            }
         } catch(err) {
            console.error(`[E] cannot get stat for ${fn} ...`);
         }
      }
   } catch(err) {
      console.error(err);
   }
}

(async function main() {
   const name = process.argv[2];
   const dir = i_path.resolve(process.argv[3]);
   const out = i_path.resolve(process.argv[4]);
   console.log(`collect files in the repo of "${name}" at ${dir} ...`);
   await collectDir(out, dir, dir);
   process.exit(0);
})();
