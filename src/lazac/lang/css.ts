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

const css_extract_feature = {
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

const css_keywords = [
];

const css_decorate_feature = {
};

export class CssParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, css_extract_feature);
      env.curI = 0;
      DecorateScope(env, css_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameCssParser = CssParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameCssParser = CssParser;
}
