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

const rust_extract_feature = {
   '"': [extract_string],
   // TODO: to identify 'lifetime, 'label or 'string'
   // '\'': [extract_char],
   '/': [extract_line_comment]
};

function extract_string(env) {
   // TODO: b"" r"" r#""# r##""## br"" br#""# br##""##
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env) {
   // TODO: b'', '1, 'a, 'static
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env) {
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

function RustParser() {}
RustParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, rust_extract_feature);
      env.curI = 0;
      DecorateScope(env, rust_decorate_feature);
      return env.tokens;
   },
};

const flameObj = (
   typeof(self) === 'undefined' ? (
      typeof(window) === 'undefined' ? {} : window
   ) : self
);
flameObj.FlameRustParser = RustParser;

module.exports = {
   RustParser,
   Parser: RustParser,
};
