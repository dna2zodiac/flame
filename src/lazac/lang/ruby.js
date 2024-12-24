const {
   STOPS,
   TAG_STRING,
   TAG_COMMENT,
   TAG_REGEX,
   IsSpace,
   SearchPrev,
} = require('../common');
const {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} = require('../extractor');

const ruby_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '`': [extract_cmd_string],
   '#': [extract_line_comment],
   '\n': [extract_end_doc],
   '<': [extract_here_doc],
   '%': [extract_raw_string],
   '=': [extract_block_comment],
   '/': [extract_regex],
};

const regex_suffix = [
   'i', 'm', 'x', 'o'
];
function extract_regex(env) {
   // e.g. /^te\nst$/, /[/]/
   // a = /regex/   /regex/i.match(...)   /1/ =~ '`'    '`' =~ /1/;
   let n = env.text.length;
   let st = env.curI;
   let ed = st;
   // search before st, should not be a number or a symbol
   //                   but can be a keyword (e.g. return)
   let t;
   let p = SearchPrev(
      env.tokens, env.tokens.length-1,
      t => IsSpace(t.T)
   );
   if (p >= 0) {
      t = env.tokens[p];
      if (STOPS.indexOf(t.T) < 0) {
         if (ruby_keywords.indexOf(t.T) >= 0) {
         } else if (t.T === 'puts') {
            // XXXX: p /test/i.to_f
            //     - v.s.:
            //       p = 1
            //       p /test/i.to_f
         } else {
            return null;
         }
      }
   }
   // search for end position
   for (let i = env.curI+1; i < n; i++) {
      let ch = env.text.charAt(i);
      if (ch === '\\') {
         i ++;
         continue;
      }
      if (ch === '/') {
         ed = i;
         break;
      }
   }
   while(ed+1 < n) {
      if (regex_suffix.indexOf(env.text.charAt(ed+1)) < 0) {
         break;
      }
      ed ++;
   }
   return {
      tag: TAG_REGEX,
      T: env.text.substring(st, ed+1)
   };
}

function extract_block_comment(env) {
   let st = env.curI, ed = st;
   let ch = env.text.substring(st-1, st+7).trim();
   if (ch !== '=begin') return null;
   ed = st + 6;
   while (true) {
      ed = env.text.indexOf('\n=end', ed);
      if (ed < 0) {
         ed = env.text.length;
         break;
      } else {
         ch = env.text.substring(ed, ed+6).trim();
         if (ch !== '=end') continue;
         ed = ed + 5;
         break;
      }
   }
   return {
      tag: TAG_COMMENT,
      T: env.text.substring(st, ed)
   }
}

const raw_string_starter = [
   '`', '~', '!', '@', '#', '$', '%', '^',
   '&', '*', '(', ')', '-', '_', '=', '+',
   '[', ']', '{', '}', '\\', '|', ';', ':',
   '\'', '"', '<', '>', ',', '.', '/', '?'
];
const raw_string_prefix = [
   'q', 'Q', 'w', 'W', 'i', 'I', 'r', 'x', 's'
];
function extract_raw_string(env) {
   let st = env.curI, ed = st+1, n = env.text.length;
   let ch = env.text.charAt(ed), prefix = null;
   if (raw_string_prefix.indexOf(ch) >= 0) {
      prefix = ch;
      ch = env.text.charAt(++ed);
   }
   if (raw_string_starter.indexOf(ch) < 0) return null;
   let left = ch, right = ch;
   switch (left) {
   case '(': right = ')'; break;
   case '[': right = ']'; break;
   case '{': right = '}'; break;
   case '<': right = '>'; break;
   }
   if (left === '\\') {
      for (let i = ed+1; i < n; i++) {
         if (env.text.charAt(i) === '\\') {
            ed = i + 1;
            break;
         }
      }
   } else if (left === right) {
      for (let i = ed+1; i < n; i++) {
         ch = env.text.charAt(i);
         if (ch === '\\') {
            i ++;
            continue;
         }
         if (ch === right) {
            ed = i + 1;
            break;
         }
      }
   } else {
      let deep = 1;
      for (let i = ed+1; i < n; i++) {
         ch = env.text.charAt(i);
         if (ch === '\\') {
            i ++;
            continue;
         }
         if (ch === left) {
            deep ++;
            continue;
         }
         if (ch === right) {
            deep --;
            if (deep) continue;
            ed = i + 1;
            break;
         }
      }
   }
   let tag = TAG_STRING;
   if (prefix === 'r') {
      for (let i = ed; i < n; i++) {
         if (regex_suffix.indexOf(env.text.charAt(i)) < 0) {
            ed = i;
            break;
         }
      }
      tag = TAG_REGEX;
   }
   return { tag, T: env.text.substring(st, ed) };
}

function extract_here_doc(env) {
   let st = env.curI, ed = st, p = -1;
   let ch = env.text.substring(st, st+3);
   let n = env.text.length;
   let marker = null;
   switch(ch) {
      case '<<-':
      ed = st + 3;
      p = env.text.indexOf('\n', ed);
      if (p < 0) p = n;
      marker = env.text.substring(ed, p);
      if (!marker) return null;
      do {
         ed = p;
         p = env.text.indexOf('\n', ed+1);
         if (p < 0) p = n;
         ch = env.text.substring(ed+1, p).trim();
      } while (marker !== ch && p < n);
      ed = p;
      return {
         tag: TAG_STRING,
         T: env.text.substring(st, ed)
      };
      case '<<E':
      ch = env.text.substring(st, st+5);
      if (ch !== '<<EOF') return null;
      marker = '\nEOF\n';
      p = env.text.indexOf(marker, p + 1)
      if (p < 0) {
         ed = n;
      } else {
         ed = p + marker.length - 1;
      }
      return {
         tag: TAG_STRING,
         T: env.text.substring(st, ed)
      }
      case '<<"': case '<<\'': case '<<`':
      ed = st + 3;
      p = env.text.indexOf('\n', ed);
      marker = '\n' + env.text.substring(ed, p-1) + '\n';
      p = env.text.indexOf(marker, p + 1)
      if (p < 0) {
         ed = n;
      } else {
         ed = p + marker.length - 1;
      }
      return {
         tag: TAG_STRING,
         T: env.text.substring(st, ed)
      }
   }
   return null;
}

function extract_end_doc(env) {
   let st = env.curI, n = '__END__'.length;
   if (env.text.substring(st-n, st) !== '__END__') return null;
   let i = st - n - 1, ch;
   for (; i >= 0; i--) {
      ch = env.text.charAt(i);
      if (ch === '\n') break;
      if (ch !== ' ' && ch !== '\t') return null;
   }
   return [{
      T: '\n'
   }, {
      tag: TAG_STRING,
      T: env.text.substring(st+1)
   }];
}

function extract_string(env) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env) {
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_cmd_string(env) {
   return ExtractString(env, '`', '`', '\\');
}

function extract_line_comment(env) {
   return ExtractComment(env, '#', '\n');
}

const ruby_keywords = [
   // ref:
   // - https://github.com/ruby/ruby/blob/trunk/defs/keywords
   '__ENCODING__', '__LINE__', '__FILE__', 'BEGIN', 'END', 'alias', 'and',
   'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else', 'elsif',
   'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not',
   'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true',
   'undef', 'unless', 'until', 'when', 'while', 'yield',
];

// TODO: decorate require 'test_library.rb'
//                require 'test_' + name + '.rb'

function RubyParser() {}
RubyParser.prototype = {
   Tokenize: function(text, opt) {
      // L, st, ed, name
      const env = {
         curI: 0,
         text: text,
         tokens: [],
      };
      ExtractTokens(env, ruby_extract_feature);
      return env.tokens;
   },
};

if (self.document === undefined) {
   const flameObj = self;
   flameObj.FlameRubyParser = RubyParser;
} else {
   const flameObj = window;
   flameObj.FlameRubyParser = RubyParser;
}

module.exports = { RubyParser, };
