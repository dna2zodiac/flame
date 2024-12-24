const STOPS = [
   '~', '`', '!', '@', '#', '$', '%', '^', '&',
   '*', '(', ')', '-', '_', '+', '=', '[', ']',
   '{', '}', '|', '\\', ':', ';', '"', '\'',
   '<', '>', ',', '.', '/', '?',
   ' ', '\t', '\n', '\r',
];

function BasicTextParser() {}
BasicTextParser.prototype = {
   Parse: function(text, opt) {
      /* opt:
         - noKeepStop: not store stop characters into result list
         - nonAsciiWord: treat non-ascii character as a word
       */
      const r = [];
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
   },
};

const TAG_COMMENT = 'comment';
const TAG_STRING = 'string';
const TAG_REGEX = 'regex';
const TAG_VARIABLE = 'variable';
const TAG_FUNCTION = 'function';
const TAG_CLASS = 'class'; // class, interface, enum, struct
const TAG_MODULE = 'module'; // namespace
const TAG_KEYWORD = 'keyword';
const TAG_BRACKET = {
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

/*
   env = { text, curI, tokens, ... }
   env.meta = {
      language features
      e.g. c++11, c++17, es5, es6, es2017, py2, py3, ...
   }
 */
/*
export interface ParseEnv {
   text: string;
   curI: number;
   tokens: Token[];
   meta?: any;
}

export interface TokenDecoration {
   tag?: string;
   // st = startIndex
   st?: number;
   // ed = endIndex
   ed?: number;
   data?: any;
}

export interface Token {
   T: string;
   startIndex?: number;
   endIndex?: number;
   tag?: string;
   // for decoration obj
   deco?: TokenDecoration;
   data?: any;
}
*/

function IsSpace(ch) {
   return space.indexOf(ch) >= 0;
}

function IsSpacen(ch) {
   return spacen.indexOf(ch) >= 0;
}

function IsNotSpace(ch) {
   return space.indexOf(ch) < 0;
}

function IsNotSpacen(ch) {
   return space.indexOf(ch) < 0;
}

function SearchPrev(tokens, index, fn) {
   while(index >= 0 && fn(tokens[index])) {
      index --;
   }
   return index;
}

function SearchNext(tokens, index, fn) {
   let n = tokens.length;
   while(index < n && fn(tokens[index])) {
      index ++;
   }
   return index;
}

function SearchPrevSkipSpace(tokens, index) {
   return SearchPrev(tokens, index, (x) => IsSpace(x.T));
}

function SearchNextSkipSpace(tokens, index) {
   return SearchNext(tokens, index, (x) => IsSpace(x.T));
}

function SearchPrevSkipSpacen(tokens, index) {
   return SearchPrev(tokens, index, (x) => IsSpacen(x.T));
}

function SearchNextSkipSpacen(tokens, index) {
   return SearchNext(tokens, index, (x) => IsSpacen(x.T));
}

function SearchPrevStop(tokens, index, query_list) {
   return SearchPrev(tokens, index, (x) => {
      return query_list.indexOf(x.T) < 0;
   });
}

function SearchNextStop(tokens, index, query_list) {
   return SearchNext(tokens, index, (x) => {
      return query_list.indexOf(x.T) < 0;
   });
}

function Subtokens(tokens, st, ed, fn) {
   let r = tokens.slice(st, ed).map((x) => x.T);
   if (fn) {
      r = r.filter(fn);
   }
   return r.join('');
}

function ClearTokenBlock(tokens, st, ed) {
   for (let i = st; i <= ed; i++) {
      const token = tokens[i];
      if (token.startIndex === undefined) continue;
      delete token.startIndex;
      delete token.endIndex;
   }
}

const left_bracket  = ['{', '[', '(', '<'];
const right_bracket = ['}', ']', ')', '>'];
const bracket_map = {
   '{': '}', '}': '{', '(': ')', ')': '(',
   '[': ']', ']': '[', '<': '>', '>': '<'
};

function DetectPair(tokens, index) {
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

module.exports = {
   STOPS,
   TAG_COMMENT,
   TAG_STRING,
   TAG_REGEX,
   TAG_VARIABLE,
   TAG_FUNCTION,
   TAG_CLASS,
   TAG_MODULE,
   TAG_KEYWORD,
   TAG_BRACKET,
   BasicTextParser,
   IsSpace,
   IsSpacen,
   IsNotSpace,
   IsNotSpacen,
   SearchPrev,
   SearchNext,
   SearchPrevSkipSpace,
   SearchNextSkipSpace,
   SearchPrevSkipSpacen,
   SearchNextSkipSpacen,
   SearchPrevStop,
   SearchNextStop,
   Subtokens,
   ClearTokenBlock,
   DetectPair,
};
