import {
   ParseEnv,
   SearchNextSkipSpace,
   SearchNextSkipSpacen,
   SearchNextStop,
   Token,
   TokenDecoration,
} from '../common';
import {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} from '../extractor';
import {
   DecorateScope,
   TokensString,
} from '../decorator';

const cpp_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env: ParseEnv) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env: ParseEnv) {
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env: ParseEnv) {
   return ExtractComment(env, '//', '\n');
}

function extract_multiline_comment(env: ParseEnv) {
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

function decorate_include(env: ParseEnv) {
   let p = SearchNextSkipSpace(env.tokens, env.curI+1);
   let token = env.tokens[p];
   if (!token) return 0;
   if (token.T !== 'include') return 0;
   const decoToken = env.tokens[env.curI];
   const deco = <TokenDecoration>{
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

export class CppParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, cpp_extract_feature);
      env.curI = 0;
      DecorateScope(env, c_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameCppParser = CppParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameCppParser = CppParser;
}
