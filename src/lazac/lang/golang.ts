import {
   Token,
   ParseEnv,
   ExtractString,
   ExtractComment,
   ExtractTokens,
} from '../extractor';

const go_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '`': [extract_raw_string],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env: ParseEnv) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_raw_string(env: ParseEnv) {
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

const go_keywords = [
   // ref:
   // - https://go.dev/ref/spec#Keywords
   'break', 'default', 'func', 'interface', 'select', 'var',
   'case', 'defer', 'go', 'map', 'struct', 'chan', 'else',
   'goto', 'package', 'switch', 'const', 'fallthrough', 'if',
   'range', 'type', 'continue', 'for', 'import', 'return'
];

export class GolangParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, go_extract_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameGolangParser = GolangParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameGolangParser = GolangParser;
}
