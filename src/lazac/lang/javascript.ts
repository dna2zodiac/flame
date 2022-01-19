import {
   Token,
   ParseEnv,
   ExtractString,
   ExtractComment,
   ExtractRegex,
   ExtractTokens,
   ExtractTokensFeatureGenerator,
} from '../extractor';

const js_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment, extract_regex_generator()],
   // >= ES6
   '`': [extract_raw_string],
};

function extract_string(env: ParseEnv) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_raw_string(env: ParseEnv) {
   // TODO: do not support complex ${...}
   // e.g. `${value + `test ${value}` + /test/.test("test") /* nested comment */ }`
   return ExtractString(env, '`', '`', '\\');
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

function extract_regex_generator() {
   return ExtractTokensFeatureGenerator(
      // e.g. return /test/.test(string);
      ExtractRegex, [['return']]
   );
}

const javascript_keywords = [
   // ref:
   // - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar
   'enum',
   'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
   'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if',
   'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw',
   'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
   /* future reserved */
   'implements', 'package', 'public', 'interface', 'private', 'static', 'let', 'protected',
   'await', 'async',
   'abstract', 'float', 'synchronized', 'boolean', 'goto', 'throws', 'byte', 'int',
   'transient', 'char', 'long', 'volatile', 'double', 'native', 'final', 'short',
   'null', 'true', 'false',
];

export class JavascriptParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, js_extract_feature);
      // TODO: merge $ and var name like $name
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameJavascriptParser = JavascriptParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameJavascriptParser = JavascriptParser;
}
