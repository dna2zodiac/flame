const {
   STOPS,
   TAG_STRING,
   TAG_COMMENT,
   TAG_REGEX,
   IsSpace,
   SearchPrev,
} = require('./common');

function ExtractSymbol(env) {
   let st = env.curI, ed = st;
   let n = env.text.length;
   let ch;
   while (ed < n) {
      ch = env.text.charAt(ed);
      if (STOPS.indexOf(ch) >= 0) break;
      ed ++;
   }
   if (st === ed) {
      // operator
      return {
         T: env.text.substring(st, ed+1)
      };
   } else {
      // symbol
      return {
         T: env.text.substring(st, ed)
      };
   }
}

function ExtractComment(env, start, end) {
   let st = env.curI;
   if (env.text.substring(st, st+start.length) !== start) return null;
   let ed = env.text.indexOf(end, st + start.length);
   if (ed < 0) ed = env.text.length; else ed += end.length;
   return {
      tag: TAG_COMMENT,
      T: env.text.substring(st, ed)
   };
}

function ExtractString(env, start, end, escape_on) {
   let st = env.curI;
   if (env.text.substring(st, st+start.length) !== start) return null;
   let ed = env.text.indexOf(end, st + start.length);
   if (escape_on) {
      let ed_len = end.length, es_len = escape_on.length;
      while (ed >= 0) {
         ed = env.text.indexOf(end, ed);
         if (back_lookup(env.text, ed, escape_on) % 2 === 0) break;
         ed += ed_len;
      }
   }
   if (ed < 0) ed = env.text.length; else ed += end.length;
   return {
      tag: TAG_STRING,
      T: env.text.substring(st, ed)
   };

   function back_lookup(text, index, chgroup) {
      let count = 0;
      let len = chgroup.length;
      while (text.substring(index-len, index) === chgroup) {
         index -= len;
         count ++;
      }
      return count;
   }
}

const regex_sufix = ['g', 'i', 'm', 's', 'u', 'y'];
function ExtractRegex(env, keywords) {
   // e.g. /^test$/gi, /[/]/
   // a=/regex/;   true && /regex/i.test()   replace(/regex/g, '1');
   let n = env.text.length;
   let st = env.curI;
   let ed = env.text.indexOf('\n', st + 1);
   if (ed < 0) ed = n;
   let ed_pair = env.text.indexOf('/', st + 1);
   if (ed_pair < 0) return null;
   if (ed_pair > ed) return null;
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
         if (keywords && keywords.indexOf(t.T) < 0) {
            return null;
         }
      }
   }
   // search for end position
   const subenv = { text: env.text, curI: -1 }
   let pair_deep = 0;
   let pair_ch = null;
   let ed_found = false;
   for (let i = env.curI+1; i < n; i++) {
      let ch = env.text.charAt(i);
      switch (ch) {
         case '[':
         pair_ch = ']';
         case '{':
         pair_ch = pair_ch || '}';
         subenv.curI = i;
         // no nest; e.g. /([A-Za-z0-9[\]]{2, 3})/
         t = ExtractString(subenv, ch, pair_ch, '\\');
         i += t.T.length - 1;
         pair_ch = null;
         break;
         case '(':
         pair_deep ++;
         break;
         case ')':
         pair_deep --;
         break;
         case '\\':
         i ++;
         break;
         case '/': // if pair_deep > 0, error
         ed = i;
         ed_found = true;
         break;
         case '\n': // error
         ed = i-1;
         ed_found = true;
         break;
      }
      if (ed_found) break;
   }
   if (pair_deep) return null;
   if (!ed_found) return null;
   while(ed+1 < n) {
      if (regex_sufix.indexOf(env.text.charAt(ed+1)) < 0) {
         break;
      }
      ed ++;
   }
   return {
      tag: TAG_REGEX,
      T: env.text.substring(st, ed+1)
   };
}

function ExtractFeature(env, features) {
   if (!features) return null;
   let i, n, r;
   for (i = 0, n = features.length; i < n; i++) {
      r = features[i](env);
      if (r) return r;
   }
   return null;
}

function ExtractTokensFeatureGenerator(f, args) {
   return (env) => {
      return f(env, ...args);
   };
}

function ExtractTokens(env, feature_map) {
   let extract_others = feature_map.default || ExtractSymbol;
   let n, r, output;
   output = [];
   env.tokens = output;
   n = env.text.length;
   while (env.curI < n) {
      r = ExtractFeature(env, feature_map[env.text.charAt(env.curI)]);
      if (!r) r = extract_others(env);
      if (!r) { /* not belong to any feature; should not be here */ }
      if (!Array.isArray(r)) r = [r];
      r.forEach(x => {
         output.push(x);
         env.curI += x.T.length;
         if (x.tag === TAG_COMMENT) {
            x.data = x.T;
            x.T = '';
         }
      });
   }
   return output;
}

module.exports = {
   ExtractSymbol,
   ExtractComment,
   ExtractString,
   ExtractRegex,
   ExtractFeature,
   ExtractTokensFeatureGenerator,
   ExtractTokens,
};
