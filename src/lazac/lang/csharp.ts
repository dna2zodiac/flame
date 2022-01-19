import {SyntaxItem} from '../../share/common';
import {
   Token,
   ParseEnv,
   ExtractString,
   ExtractComment,
   ExtractTokens,
   ConvertTokenToSyntaxItem,
} from '../extractor';

const csharp_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env: ParseEnv) {
   // TODO: @"C:\raw\data"
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

const csharp_keywords = [
   // ref:
   // - https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/
   // - https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/preprocessor-directives/
   'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
   'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
   'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
   'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
   'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace',
   'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private',
   'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
   'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
   'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
   'using', 'virtual', 'void', 'volatile', 'while',

   'add', 'alias', 'ascending', 'async', 'await', 'by', 'descending', 'dynamic', 'equals',
   'from', 'get', 'global', 'group', 'into', 'join', 'let', 'nameof', 'on',
   'orderby', 'partial', 'remove', 'select', 'set', 'value', 'var', 'when',
   'where', 'yield',

   '#if', '#else', '#elif', '#endif', '#define', '#undef', '#warning', '#error', '#line',
   '#region', '#endregion', '#pragma',
];

export class CSharpParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): SyntaxItem[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, csharp_extract_feature);
      return ConvertTokenToSyntaxItem(env.tokens);
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameCSharpParser = CSharpParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameCSharpParser = CSharpParser;
}
