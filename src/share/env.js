const IGNORE_DIRS = ['.p4', '.git', '.flame', '.zoekt'];

function IsIgnored(path) {
   if (!path) return true;
   const n = IGNORE_DIRS.length;
   const sn = path.length;
   for (let i = 0; i < n; i++) {
      const s = IGNORE_DIRS[i];
      const si = path.indexOf(s);
      if (si < 0) continue;
      if (s.length === path.length && s === path) return true;
      if (path.indexOf(`/${s}/`) >= 0) return true;
      if (path.startsWith(`${s}/`)) return true;
      if (path.endsWith(`/${s}`)) return true;
   }
   return false;
}

module.exports = {
   IGNORE_DIRS,
   IsIgnored,
};
