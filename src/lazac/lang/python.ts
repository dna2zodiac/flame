import {SyntaxItem} from '../../share/common';
import {
   Token,
   ParseEnv,
   ExtractString,
   ExtractComment,
   ExtractTokens,
   ConvertTokenToSyntaxItem,
} from '../extractor';

const python_extract_feature = {
   '"': [extract_doc_string_d, extract_string_d],
   '\'': [extract_doc_string_s, extract_string_s],
   '#': [extract_line_comment],
};

function extract_doc_string_d(env: ParseEnv) {
   return ExtractString(env, '"""', '"""', '\\');
}

function extract_doc_string_s(env: ParseEnv) {
   return ExtractString(env, '\'\'\'', '\'\'\'', '\\');
}

function extract_string_d(env: ParseEnv) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_string_s(env: ParseEnv) {
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env: ParseEnv) {
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

export class PythonParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): SyntaxItem[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, python_extract_feature);
      return ConvertTokenToSyntaxItem(env.tokens);
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlamePythonParser = PythonParser;
} else {
   const flameObj = <any>window;
   flameObj.FlamePythonParser = PythonParser;
}
