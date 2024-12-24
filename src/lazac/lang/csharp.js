const {
   SearchNext,
   SearchNextSkipSpacen,
   SearchPrevSkipSpacen,
} = require('../common');
const { DecorateScope } = require('../decorator');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');

const csharp_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env) {
   // ref: https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/verbatim
   // ref: 
   // TODO: @"C:\raw\data"
   //       @"He said, ""This is the last \u0063hance\x0021"""
   //       $"Hello, {name}! Today is {date.DayOfWeek}, it's {date:HH:mm} now."
   //       $"{name} is {age} year{(age == 1 ? "" : "s")} old."
   //       $"|{"Left",-7}|{"Right",7}|"
   // TODO: string[] @for = { "John", "James", "Joan", "Jamie" }; Console.WriteLine($"Here is your gift, {@for[0]}!")
   //       [@Info("A simple executable.")]
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

const csharp_decorate_feature = {
   'using': [decorate_import],
   // 'DllImport': [decorate_dll_import], // e.g. [DllImport("User32.dll")]
};

function decorate_import(env) {
   // TODO: check not using block
   //       e.g. using (Font font1 = new Font("Arial", 10.0f))
   // https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/using-directive
   let st = env.curI, ed = st;
   let using_token = env.tokens[st];
   ed = SearchNextSkipSpacen(env.tokens, ed+1);
   let token = env.tokens[ed];
   if (!token) return 0;
   let is_static = false;
   if (token.T === 'static') {
      is_static = true;
      ed = SearchNextSkipSpacen(env.tokens, ed+1);
      token = env.tokens[ed];
   }
   let name = [ed, ed];
   let alias = null;
   ed = SearchNext(
      env.tokens, ed+1,
      (x) => x.T !== '=' && x.T !== ';'
   );
   token = env.tokens[ed];
   name[1] = SearchPrevSkipSpacen(env.tokens, ed-1)+1;
   if (!token) return 0;
   if (token.T === '=') {
      ed = SearchNextSkipSpacen(env.tokens, ed+1);
      alias = [ed, ed];
      ed = SearchNext(env.tokens, ed+1, (x) => x.T !== ';');
      token = env.tokens[ed];
      if (!token) return 0;
      alias[1] = SearchPrevSkipSpacen(env.tokens, ed-1)+1;
   } else if (is_static) {
      alias = name;
      name = null;
   } else {
      alias = [name[0], name[1]];
   }
   const deco = {
      st, ed,
      tag: 'using',
      data: { alias, name },
   };
   using_token.deco = deco;
   return ed - st + 1;
}

function CSharpParser() {}
CSharpParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, csharp_extract_feature);
      env.curI = 0;
      DecorateScope(env, csharp_decorate_feature);
      return env.tokens;
   },
};

if (self.document === undefined) {
   const flameObj = self;
   flameObj.FlameCSharpParser = CSharpParser;
} else {
   const flameObj = window;
   flameObj.FlameCSharpParser = CSharpParser;
}

module.exports = {
   CSharpParser,
};
