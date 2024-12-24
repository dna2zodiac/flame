const i_path = require('path');
const i_fs = require('fs').promises;
const i_db = require('./db');

async function insertPath(tblname, pid, lv, p, c) {
   const r = await i_db.seven.raw.query(`INSERT INTO ${tblname} (pid, lv, p, c) VALUES ($1, $2, $3, $4) RETURNING id`, [pid, lv, p, c]);
   const item = r.rows[0];
   return item.id;
}

async function updatePath(tblname, id, c) {
   await i_db.seven.raw.query(`UPDATE ${tblname} SET c = ${c} WHERE id = ${id};`);
}

async function collectDir(tblname, base, dir, pid, lv) {
   if (!dir) return;
   try {
      console.log(`[I] collect info in ${dir} ...`);
      const list = await i_fs.readdir(dir);
      let c = 0;
      const id = await insertPath(tblname, pid, lv, `${dir.substring(base.length)}/`, 0);
      for (let i = 0, n = list.length; i < n; i++) {
         const name = list[i];
         if (name === '.git') continue;
         const fn = i_path.join(dir, name);
         try {
            const stat = await i_fs.lstat(fn);
            if (stat.isFile()) {
               await insertPath(tblname, pid, lv, fn.substring(base.length), 0);
               c ++;
            } else if (stat.isDirectory()) {
               c += await collectDir(tblname, base, fn, id, lv+1);
            } else if (stat.isSymbolicLink()) {
               await insertPath(tblname, pid, lv, fn.substring(base.length), 1);
            }
         } catch(err) {
            console.error(`[E] cannot get stat for ${fn} ...`);
         }
      }
      await updatePath(tblname, id, c);
      console.log(`[I] files n = ${c}`);
      return c;
   } catch(err) {
      console.error(err);
      return 0;
   }
}

(async function main() {
   const name = process.argv[2];
   const dir = i_path.resolve(process.argv[3]);
   console.log(`collect files in the repo of "${name}" at ${dir} ...`);
   await i_db.seven.raw.query(`CREATE TABLE IF NOT EXISTS ${name}_files (
      id serial primary key,
      pid bigint default 0,
      lv integer default 0,
      p varchar(1024) unique,
      c integer default 0
   );`);
   await i_db.seven.raw.query(`DELETE FROM ${name}_files;`);
   const n = await collectDir(`${name}_files`, dir, dir, 0, 0);
   console.log(`[I] total = ${n}`);
   process.exit(0);
})();
