import {
   ParseEnv,
   Token,
   TokenDecoration,
   SearchNextSkipSpace,
   SearchNextStop,
   SearchNextSkipSpacen,
} from '../common';
import {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} from '../extractor';
import {
   TokensString,
   DecorateScope,
} from '../decorator';

const rust_extract_feature = {
   '"': [extract_string],
   // TODO: to identify 'label or 'string'
   // '\'': [extract_char],
   '/': [extract_line_comment]
};

function extract_string(env: ParseEnv) {
   // TODO: b"" r"" r#""# r##""## br"" br#""# br##""##
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env: ParseEnv) {
   // TODO b''
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env: ParseEnv) {
   return ExtractComment(env, '//', '\n');
}

const rust_keywords = [
   // ref: https://doc.rust-lang.org/book/appendix-01-keywords.html
   'as', 'async', 'await', 'break', 'const', 'continue', 'crate',
   'dyn', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if',
   'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub',
   'ref', 'return', 'Self', 'self', 'static', 'struct', 'super',
   'trait', 'true', 'union', 'unsafe', 'use', 'where', 'while',
   // for future use
   'abstract', 'become', 'box', 'do', 'final', 'macro', 'override',
   'priv', 'try', 'typeof', 'unsized', 'virtual', 'yield',
];

const rust_decorate_feature = {
};

export class RustParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, rust_extract_feature);
      env.curI = 0;
      DecorateScope(env, rust_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameRustParser = RustParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameRustParser = RustParser;
}
