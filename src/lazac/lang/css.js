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

const css_extract_feature = {
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

const css_keywords = [
];

const css_decorate_feature = {
};

function CssParser() {}
CssParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, css_extract_feature);
      env.curI = 0;
      DecorateScope(env, css_decorate_feature);
      return env.tokens;
   },
};

const flameObj = (
   typeof(self) === 'undefined' ? (
      typeof(window) === 'undefined' ? {} : window
   ) : self
);
flameObj.FlameCssParser = CssParser;

module.exports = {
   CssParser,
   Parser: CssParser,
};
