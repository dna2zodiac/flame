const {
   SearchNext,
   SearchNextSkipSpace,
} = require('../common');
const { DecorateScope } = require('../decorator');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');

const java_extract_feature = {
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

const java_keywords = [
   // ref:
   // - https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
   // java7
   'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'default', 'goto', 'package', 'synchronized',
   'boolean', 'do', 'if', 'private', 'this', 'break', 'double', 'implements', 'protected', 'throw',
   'byte', 'else', 'import', 'public', 'throws', 'case', 'enum', 'instanceof', 'return', 'transient',
   'catch', 'extends', 'int', 'short', 'try', 'char', 'final', 'interface', 'static', 'void',
   'class', 'finally', 'long', 'strictfp', 'volatile', 'const', 'float', 'native', 'super', 'while',
   '@interface',
];

const java_decorate_feature = {
   'import': [decorate_import],
};

function decorate_import(env) {
   const st = env.curI;
   const start_token = env.tokens[st];
   let name_st = SearchNextSkipSpace(env.tokens, st+1);
   let x = env.tokens[name_st];
   const deco = {
      st: env.curI,
      ed: -1,
      tag: 'import',
      data: {
         static: false,
         import: null,
         basename: null,
      },
   };
   if (x.T === 'static') {
      deco.data.static = true;
      name_st = SearchNextSkipSpace(env.tokens, name_st+1);
   }
   let ed = SearchNext(
      env.tokens, name_st,
      x => x.T !== ';' && x.T !== '\n'
   );
   deco.data.import = [st, ed];
   // NOTES: import a.b.c.d
   //        import a.b.c.*
   deco.data.basename = [name_st, ed];
   deco.ed = ed;
   start_token.deco = deco;
   return ed - st + 1;
}

function JavaParser() {}
JavaParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, java_extract_feature);
      env.curI = 0;
      DecorateScope(env, java_decorate_feature);
      return env.tokens;
   },
};

if (self.document === undefined) {
   const flameObj = self;
   flameObj.FlameJavaParser = JavaParser;
} else {
   const flameObj = window;
   flameObj.FlameJavaParser = JavaParser;
}

module.exoprts = { JavaParser, };
