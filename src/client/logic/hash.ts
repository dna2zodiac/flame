export class HashL {
   // L=singleLine,multipleLineStart-multipleLineEnd
   // e.g. L=1,3,5,8-20
   //      Lset = [[1,2],[3,4],[5,6],[8,20]]
   Lset: number[][];

   constructor(L: string) {
      this.Parse(L);
   }

   Parse(L: string) {
      this.Reset();
      if (!L) return;
      const parts = L.split(',');
      parts.forEach((one: string) => {
         const ab = one.split('-');
         if (!ab[1]) {
            const a = parseInt(ab[0], 10);
            this.AddRange(a, a+1);
         } else {
            const a = parseInt(ab[0], 10);
            const b = parseInt(ab[1], 10);
            if (a < b) {
               this.AddRange(a, b);
            } else {
               this.AddRange(b, a);
            }
         }
      });
   }

   Reset() {
      this.Lset = [];
   }

   AddRange(st: number, ed: number) {
      const r: number[][] = [];
      this.Lset.sort((a: number[], b: number[]) => a[0] - b[0]);
      const n = this.Lset.length;
      let notMerged = true;
      for (let i = 0; i < n; i++) {
         const ab = this.Lset[i];
         if (notMerged) {
            if (ed < ab[1]) {
               // before
               r.push([st, ed]);
               notMerged = false;
            } else if (st <= ab[1] && ed >= ab[0]) {
               // cross
               ab[0] = Math.min(ab[0], st);
               ab[1] = Math.max(ab[1], ed);
               notMerged = false;
            }
         }
         const last = r.pop();
         if (last && last[0] <= ab[1] && last[1] >= ab[0]) {
            last[0] = Math.min(last[0], ab[0]);
            last[1] = Math.max(last[1], ab[1]);
            r.push(last);
         } else {
            if (last) r.push(last);
            r.push(ab);
         }
      }
      if (notMerged) {
         r.push([st, ed]);
      }
      this.Lset = r;
   }

   DelRange(st: number, ed: number) {
      const r: number[][] = [];
      this.Lset.sort((a: number[], b: number[]) => a[0] - b[0]);
      const n = this.Lset.length;
      for (let i = 0; i < n; i++) {
         const ab = this.Lset[i];
         if (st < ab[1] && ed > ab[0]) {
            if (st > ab[0] && ed < ab[1]) {
               r.push([ab[0], st]);
               r.push([ed, ab[1]]);
            } else if (st <= ab[0] && ed < ab[1]) {
               r.push([ed, ab[1]]);
            } else if (st > ab[0] && ed >= ab[1]) {
               r.push([ab[0], st]);
            }
         } else {
            r.push(ab);
         }
      }
      this.Lset = r;
   }

   CheckCross(a: number, b: number): boolean {
      const n = this.Lset.length;
      for (let i = 0; i < n; i++) {
         const ab = this.Lset[i];
         if (a < ab[1] && b > ab[0]) return true;
      }
      return false;
   }

   GetRange(): number[] | null {
      if (!this.Lset.length) return null;
      const r = [0, 0];
      const head = this.Lset[0];
      const tail = this.Lset[this.Lset.length-1];
      r[0] = head[0];
      r[1] = tail[1];
      return r;
   }

   GetRaw(): number[][] {
      return this.Lset;
   }

   GetLstr(): string {
      return this.Lset.map((ab: number[]) => {
         if (ab[0] >= ab[1]) return '';
         if (ab[1] - ab[0] === 1) {
            return `${ab[0]}`;
         } else {
            return `${ab[0]}-${ab[1]}`;
         }
      }).filter((x: string) => !!x).join(',');
   }
}
