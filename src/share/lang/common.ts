export const STOPS = [
   '~', '`', '!', '@', '#', '$', '%', '^', '&',
   '*', '(', ')', '-', '_', '+', '=', '[', ']',
   '{', '}', '|', '\\', ':', ';', '"', '\'',
   '<', '>', ',', '.', '/', '?',
   ' ', '\t', '\n', '\r',
];

export class BasicTextParser {
   constructor() {}

   Parse(text: string): string[] {
      const r: string[] = [];
      const n = text.length;
      let cache = '';
      for (let i = 0; i < n; i++) {
         const ch = text.charAt(i);
         if (STOPS.includes(ch)) {
            if (cache) {
               r.push(cache);
               cache = '';
            }
            r.push(ch);
         } else {
            cache += ch;
         }
      }
      if (cache) r.push(cache);
      return r;
   }
}
