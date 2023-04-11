export function BinarySearch(a: number, b: number, val: any, fn: any) {
   let st = a, ed = b;
   if (st === ed) {
      return st;
   }
   if (val < fn(st)) return -1;
   if (val > fn(ed)) return -1;
   while (st < ed) {
      const mid = ~~((st + ed) / 2);
      const fnval = fn(mid);
      if (fnval == val) return mid;
      if (fnval > val) {
         ed = mid;
      } else {
         if (st === mid) break;
         st = mid;
      }
   }
   return st;
}
