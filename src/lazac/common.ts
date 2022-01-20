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

      const keepStop = !opt.noKeepStop;
      const wideCharWord = opt.nonAsciiWord;

      let cache = '';
      for (let i = 0; i < n; i++) {
         const ch = text.charAt(i);
         if (STOPS.includes(ch)) {
            if (cache) {
               r.push(cache);
               cache = '';
            }
            if (keepStop) r.push(ch);
         } else if (wideCharWord && ch.charCodeAt(0) >= 128) {
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

export const TAG_COMMENT = 'comment';
export const TAG_STRING = 'string';
export const TAG_REGEX = 'regex';
export const TAG_VARIABLE = 'variable';
export const TAG_FUNCTION = 'function';
export const TAG_CLASS = 'class'; // class, interface, enum, struct
export const TAG_MODULE = 'module'; // namespace
export const TAG_KEYWORD = 'keyword';
export const TAG_BRACKET = <any>{
   '{': '{}', '}': '{}',
   '(': '()', ')': '()',
   '[': '[]', ']': '[]',
   '<': '<>', '>': '<>',
};

// '' -> TAG_COMMENT
const space = ['', ' ', '\t'];
const spacen = ['', ' ', '\t', '\r', '\n'];
/*const bracket = {
   left: ['(', '{', '['],
   right: [')', '}', ']'],
   full_left: ['(', '{', '[', '<'],
   full_right: [')', '}', ']', '>'],
};*/

/* env = { text, curI, tokens, ... } */
export interface ParseEnv {
   text: string;
   curI: number;
   tokens: Token[];
}

export interface Token {
   T: string;
   startIndex?: number;
   endIndex?: number;
   tag?: string;
   data?: any;
}

export function IsSpace(ch: string): boolean {
   return space.indexOf(ch) >= 0;
}

export function IsSpacen(ch: string): boolean {
   return spacen.indexOf(ch) >= 0;
}

export function IsNotSpace(ch: string): boolean {
   return space.indexOf(ch) < 0;
}

export function IsNotSpacen(ch: string): boolean {
   return space.indexOf(ch) < 0;
}

export function SearchPrev(tokens: any[], index: number, fn: any): number {
   while(index >= 0 && fn(tokens[index])) {
      index --;
   }
   return index;
}

export function SearchNext(tokens: any[], index: number, fn: any): number {
   let n = tokens.length;
   while(index < n && fn(tokens[index])) {
      index ++;
   }
   return index;
}

export function SearchPrevSkipSpace(tokens: any[], index: number): number {
   return SearchPrev(tokens, index, (x: any) => IsSpace(x.T));
}

export function SearchNextSkipSpace(tokens: any[], index: number): number {
   return SearchNext(tokens, index, (x: any) => IsSpace(x.T));
}

export function SearchPrevSkipSpacen(tokens: any[], index: number): number {
   return SearchPrev(tokens, index, (x: any) => IsSpacen(x.T));
}

export function SearchNextSkipSpacen(tokens: any[], index: number): number {
   return SearchNext(tokens, index, (x: any) => IsSpacen(x.T));
}

export function SearchPrevStop(tokens: any[], index: number, query_list: string[]): number {
   return SearchPrev(tokens, index, (x: any) => {
      return query_list.indexOf(x.T) < 0;
   });
}

export function SearchNextStop(tokens: any[], index: number, query_list: string[]): number {
   return SearchNext(tokens, index, (x: any) => {
      return query_list.indexOf(x.T) < 0;
   });
}

export function Subtokens(tokens: any[], st: number, ed: number, fn: any): string {
   let r: string[] = tokens.slice(st, ed).map((x: any) => x.T);
   if (fn) {
      r = r.filter(fn);
   }
   return r.join('');
}

export function ClearTokenBlock(tokens: any[], st: number, ed: number) {
   for (let i = st; i <= ed; i++) {
      const token = tokens[i];
      if (token.startIndex === undefined) continue;
      delete token.startIndex;
      delete token.endIndex;
   }
}

const left_bracket  = ['{', '[', '(', '<'];
const right_bracket = ['}', ']', ')', '>'];
const bracket_map = <any>{
   '{': '}', '}': '{', '(': ')', ')': '(',
   '[': ']', ']': '[', '<': '>', '>': '<'
};

export function DetectPair(tokens: any[], index: number): any {
   let token = tokens[index], ch = token.token;
   let st, ed, c;
   if (left_bracket.indexOf(ch) >= 0) {
      st = index;
      if (token.endIndex !== undefined) {
         return { startIndex: st, endIndex: token.endIndex };
      }
      ed = st;
      c = 1;
      while (c > 0) {
         ed = SearchNextStop(tokens, ed+1, [ch, bracket_map[ch]]);
         token = tokens[ed];
         if (token.token === ch) {
            c ++;
            continue
         }
         c --;
      }
      return { startIndex: st, endIndex: ed };
   } else if (right_bracket.indexOf(ch) >= 0) {
      ed = index;
      if (token.startIndex !== undefined) {
         return { startIndex: token.startIndex, endIndex: ed };
      }
      st = ed;
      c = 1;
      while (c > 0) {
         st = SearchPrevStop(tokens, st-1, [ch, bracket_map[ch]]);
         token = tokens[st];
         if (token.token === ch) {
            c ++;
            continue
         }
         c --;
      }
   } else {
      // should not be here
      return null;
   }
}
