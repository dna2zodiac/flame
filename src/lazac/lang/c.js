const {
   SearchNextSkipSpace,
   SearchNextStop,
   SearchNextSkipSpacen,
} = require('../common');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');
const {
   TokensString,
   DecorateScope,
} = require('../decorator');

const c_extract_feature = {
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

const c_keywords = [
   // ref:
   // - https://en.cppreference.com/w/c/keyword
   'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
   'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register',
   'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef',
   'union', 'unsigned', 'void', 'volatile', 'while',
   /* C99 */ '_Bool', '_Complex', '_Imaginary', 'inline', 'restrict', '_Pragma',
   /* C11 */ '_Alignas', '_Alignof', '_Atomic', '_Generic', '_Noreturn', '_Static_assert',
   '_Thread_local',
   /* C extension */ 'asm', 'fortran',
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
   decoToken.deco = deco;
   return deco.ed - deco.st;
}

function CParser() {}
CParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, c_extract_feature);
      env.curI = 0;
      DecorateScope(env, c_decorate_feature);
      return env.tokens;
   },
};

if (self.document === undefined) {
   const flameObj = self;
   flameObj.FlameCParser = CParser;
} else {
   const flameObj = window;
   flameObj.FlameCParser = CParser;
}

module.exports = {
   CParser,
};
