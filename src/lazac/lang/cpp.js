const {
   SearchNextSkipSpace,
   SearchNextSkipSpacen,
   SearchNextStop,
   TAG_STRING,
   TAG_COMMENT,
   TAG_REGEX,
} = require('../common');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');
const {
   DecorateScope,
   TokensString,
} = require('../decorator');
const {
   CharCount,
} = require('../convert');

const cpp_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env) {
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env) {
   return ExtractComment(env, '//', '\n');
}

function extract_multiline_comment(env) {
   return ExtractComment(env, '/*', '*/');
}

const cpp_keywords = [
   // ref:
   // - https://en.cppreference.com/w/cpp/keyword
   'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
   'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register',
   'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef',
   'union', 'unsigned', 'void', 'volatile', 'while',
   /* C99 */ '_Bool', '_Complex', '_Imaginary', 'inline', 'restrict', '_Pragma',
   /* C11 */ '_Alignas', '_Alignof', '_Atomic', '_Generic', '_Noreturn', '_Static_assert',
   '_Thread_local',
   /* C extension */ 'asm', 'fortran',
   /* C++ */ 'and', 'and_eq', 'bitand', 'bitor', 'bool', 'break', 'catch', 'char8_t',
   'char16_t', 'char32_t', 'class', 'compl', 'const_cast', 'delete', 'dynamic_cast',
   'explicit', 'export', 'false', 'friend', 'mutable', 'namespace', 'new', 'not', 'not_eq',
   'operator', 'or', 'or_eq', 'private', 'public', 'protected', 'reinterpret_cast',
   'static_cast', 'template', 'this', 'throw', 'true', 'try', 'typeid', 'typename',
   'using', 'virtual', 'wchar_t', 'xor', 'xor_eq', 'finally',
   /* C++ 11 */ 'alignas', 'alignof', 'constexpr', 'decltype', 'noexcept', 'nullptr',
   'static_assert', 'thread_local', /* 'override', 'final' */
   /* C++ 17 */
   /* C++ 20 */ 'concept', 'consteval', 'requires', /* 'audit', 'axiom' */
   /* C++ TS */ 'atomic_cancel', 'atomic_commit', 'atomic_noexcept',
   'co_await', 'co_return', 'co_yield', 'import', 'module', 'reflexpr', 'synchronized',
   /* 'transaction_safe', 'transaction_safe_dynamic' */
   '#if', '#ifdef', '#ifndef', '#else', '#elif', '#endif', '#pragma', '#error',
   '#define', '#undef', '#line', 'defined', '#include',
];

const c_decorate_feature = {
   '#': [decorate_include],
};

function decorate_include(env) {
   let p = SearchNextSkipSpace(env.tokens, env.curI+1);
   let token = env.tokens[p];
   if (!token) return 0;
   if (token.T !== 'include') return 0;
   const decoToken = env.tokens[env.curI];
   const deco = {
      tag: '#include',
      st: env.curI,
      ed: -1,
      data: [0, 0, null]
   };
   // NOTES: compile error: #include < stdio.h >
   //        compile pass:  #include /* can we */ <stdio.h>
   p = SearchNextSkipSpace(env.tokens, p+1);
   // NOTES: compile error: #include <a>b.h> should be "a>b.h"
   token = env.tokens[p];
   if (!token) return 0;
   while (token.T === '\\') {
      // must be \\\n
      p = SearchNextSkipSpacen(env.tokens, p+1);
      token = env.tokens[p];
      if (!token) return 0;
   }
   if (token.T === '<') {
      let ist = p;
      p = SearchNextStop(env.tokens, p+1, ['>']);
      token = env.tokens[p];
      if (!token) return 0;
      deco.data[2] = TokensString(env, ist, p+1);
      deco.data[0] = ist;
   } else {
      // token.tag === TAG_STRING
      deco.data[2] = token.T;
      deco.data[0] = p;
   }
   deco.ed = p + 1;
   deco.data[1] = deco.ed;
   decoToken.D = deco;
   return deco.ed - deco.st;
}

function CppParser() {}
CppParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, cpp_extract_feature);
      env.curI = 0;
      DecorateScope(env, c_decorate_feature);
      return env.tokens;
   },
   ConvertTokenToSyntaxItem: function(tokens) {
      const rs = [];
      let L = 0, col = 0;
      for (let i = 0, n = tokens.length; i < n; i++) {
         const token = tokens[i];
         const T = token.tag === TAG_COMMENT? token.data:token.T;
         const multipleLines = (
            token.tag === TAG_STRING ||
            token.tag === TAG_COMMENT
         );
         if (multipleLines) {
            // "abc\ -> "abc\\\ndef"
            // def"           ^^--- new line
            const lines = T.split('\n');
            const n = lines.length - 1;
            lines.forEach((line) => {
               rs.push({
                  L: L,
                  st: col,
                  ed: col + line.length,
                  name: token.tag,
               });
               L ++;
               col += line.length;
               if (n) col = 0;
            });
            L --;
         } else {
            if (token.D) {
               switch (token.D.tag) {
               case '#include': {
                  const ifn = token.D.data[2];
                  col += CharCount(tokens, i+1, token.D.data[0]);
                  rs.push({
                     L: L, st: T.length+col, ed: T.length+col+ifn.length, name: 'import-file',
                     data: ifn.substring(1, ifn.length - 1),
                  });
                  i = token.D.ed - 1;
                  break; }
               }
            }
            col += T.length;
            if (T === '\n') {
               L ++;
               col = 0;
            }
         }
      }
      return rs;
   },
}

const flameObj = (
   typeof(self) === 'undefined' ? (
      typeof(window) === 'undefined' ? {} : window
   ) : self
);
flameObj.FlameCppParser = CppParser;

module.exports = {
   CppParser,
   Parser: CppParser,
};
