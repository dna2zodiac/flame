export const STOPS = [
   '~', '`', '!', '@', '#', '$', '%', '^', '&',
   '*', '(', ')', '-', '_', '+', '=', '[', ']',
   '{', '}', '|', '\\', ':', ';', '"', '\'',
   '<', '>', ',', '.', '/', '?',
   ' ', '\t', '\n', '\r',
];

export class BasicTextParser {
   constructor() {}

   Parse(text: string, opt: any): string[] {
      /* opt:
         - noKeepStop: not store stop characters into result list
         - nonAsciiWord: treat non-ascii character as a word
       */
      const r: string[] = [];
      const n = text.length;
      opt = opt || {};
      let cache = '';
      for (let i = 0; i < n; i++) {
         const ch = text.charAt(i);
         if (STOPS.includes(ch)) {
            if (cache) {
               r.push(cache);
               cache = '';
            }
            if (opt.noKeepStop) r.push(ch);
         } else if (opt.nonAsciiWord && ch.charCodeAt(0) >= 128) {
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
