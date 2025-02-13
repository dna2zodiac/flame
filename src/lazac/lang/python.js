const {
   SearchNextSkipSpace,
   SearchNextSkipSpacen,
} = require('../common');
const { DecorateScope } = require('../decorator');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');

const python_extract_feature = {
   '"': [extract_doc_string_d, extract_string_d],
   '\'': [extract_doc_string_s, extract_string_s],
   '#': [extract_line_comment],
};

function extract_doc_string_d(env) {
   return ExtractString(env, '"""', '"""', '\\');
}

function extract_doc_string_s(env) {
   return ExtractString(env, '\'\'\'', '\'\'\'', '\\');
}

function extract_string_d(env) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_string_s(env) {
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env) {
   return ExtractComment(env, '#', '\n');
}

const python_keywords = [
   // ref:
   // - https://github.com/python/cpython/blob/2.7/Lib/keyword.py
   // - https://github.com/python/cpython/blob/3.7/Lib/keyword.py
   'and', 'as', 'assert', 'break', 'class', 'continue', 'def',
   'del', 'elif', 'else', 'except', 'finally', 'while', 'with',
   'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
   'not', 'or', 'pass', 'raise', 'return', 'try', 'yield',
   /* 2 */ 'print', 'exec',
   /* 3 */ 'False', 'None', 'True', 'async', 'await', 'nonlocal',
];


const python_decorate_feature = {
   'from': [decorate_import],
   'import': [decorate_import],
};

function python_detect_full_name(tokens, index) {
   let st = index, ed = st, t = ed, n = tokens.length;
   let token;
   while (t < n && t > 0) {
      t = SearchNextSkipSpacen(tokens, ed+1);
      token = tokens[t];
      if (!token) break;
      if (token.T !== '.') break;
      t = SearchNextSkipSpacen(tokens, t+1);
      ed = t;
   }
   return {
      startIndex: st,
      endIndex: ed+1
   }
}

function decorate_import(env) {
   // import os
   // from os import getenv
   // from math import abs, sin, cos
   // from subprocess import ( PIPE, Popen, MAXFD )
   let st = env.curI, ed = SearchNextSkipSpace(env.tokens, st+1);
   let start_token = env.tokens[st], cursor = start_token;
   let base_position;
   start_token.startIndex = st;
   const deco = {
      st, ed: -1,
      tag: 'import',
      data: {
         base: null,
         import_list: null
      }
   };
   if (cursor.T === 'from') {
      base_position = python_detect_full_name(env.tokens, ed);
      deco.data.base = [base_position.startIndex, base_position.endIndex];
      ed = SearchNextSkipSpace(env.tokens, base_position.endIndex);
      cursor = env.tokens[ed];
      ed = SearchNextSkipSpace(env.tokens, ed+1);
   }
   if (cursor.T === 'import') {
      let i = SearchNextSkipSpace(env.tokens, ed);
      let import_positions = [];
      let token = env.tokens[i];
      let position;
      if (token.T === '(') {
         // ... import ( ... )
         //@depend decorate_bracket
         ed = token.endIndex;
         i = SearchNextSkipSpacen(env.tokens, i+1);
         token = env.tokens[i];
         while (i < ed && token) {
            // deal with ... import ( ..., tail, )
            if (token.T === ')') break;
            position = python_detect_full_name(env.tokens, i);
            import_positions.push(position);
            i = SearchNextSkipSpacen(env.tokens, position.endIndex);
            // env.tokens[i].token should be ','
            i = SearchNextSkipSpacen(env.tokens, i+1);
            token = env.tokens[i];
         }
      } else {
         // ... import ...
         position = python_detect_full_name(env.tokens, i);
         import_positions.push(position);
         ed = position.endIndex;
      }
      deco.ed = ed;
      deco.data.import_list = import_positions;
      start_token.deco = deco;

      return ed - st;
   }
}

function PythonParser() {}
PythonParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, python_extract_feature);
      env.curI = 0;
      DecorateScope(env, python_decorate_feature);
      return env.tokens;
   },
};

const flameObj = (
   typeof(self) === 'undefined' ? (
      typeof(window) === 'undefined' ? {} : window
   ) : self
);
flameObj.FlamePythonParser = PythonParser;

module.exports = {
   PythonParser,
   Parser: PythonParser,
};
