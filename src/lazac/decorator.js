const {
    TAG_BRACKET,
    TAG_KEYWORD,
    SearchNext,
} = require('./common');


const common_left_bracket  = ['(', '{', '['];
const common_right_bracket = [')', '}', ']'];
const common_left_right_bracket_map = {
   '(': ')', '{': '}', '[': ']', '<': '>'
};

function TokensString(env, st, ed) {
   return env.tokens.slice(st, ed).map(x => x.T).join('');
}

function DecorateSkipCurrentLine(env) {
   const st = env.curI;
   const ed = SearchNext(
      env.tokens, st+1,
      // comment | x.T === ''
      x => !x.T || x.T !== '\n'
   );
   return ed - st + 1;
}

function DecorateBracket(env) {
   let stack = [];
   let i, n, ch, token;
   for (i = 0, n = env.tokens.length; i < n; i++) {
      token = env.tokens[i];
      ch = token.T;
      if (common_left_bracket.indexOf(ch) >= 0) {
         stack.push({i: i, ch: common_left_right_bracket_map[ch]});
         if (!token.D) token.D = {};
         token.D.st = i;
         token.D.tag = TAG_BRACKET[ch];
      } else if (common_right_bracket.indexOf(ch) >= 0) {
         let pair = stack.pop();
         if (pair.ch !== ch) {
             /* bracket not match; should not be here */
             // TODO: if here, what we can do?
         }
         const pairToken = env.tokens[pair.i];
         if (!pairToken.D) pairToken.D = {};
         pairToken.D.ed = i+1;
      }
   }
   return env.tokens.length;
}

function DecorateKeywords(env, keywords) {
   env.tokens.forEach((token) => {
      if (keywords.indexOf(token.T) >= 0) {
         if (!token.D) token.D = {};
         token.D.tag = TAG_KEYWORD;
      }
   });
   return env.tokens.length;
}

function DecorateFeature(env, features) {
   if (!features) return 0;
   let i, n, r;
   for (i = 0, n = features.length; i < n; i++) {
      r = features[i](env);
      if (r > 0) return r;
   }
   return 0;
}

function DecorateScope(env, feature_map, feature_default_fn) {
   const decorate_others = feature_default_fn;
   const n = env.tokens.length;
   let r = 0;
   while (env.curI < n) {
      let name = env.tokens[env.curI].T;
      let features = feature_map[name];
      if (Array.isArray(features)) {
         // dict['constructor'] may cause error
         r = DecorateFeature(env, features);
      } else {
         r = 0;
      }
      if (!r) r = decorate_others && decorate_others(env) || 1;
      env.curI += r;
   }
   return env.tokens;
}

module.exports = {
   TokensString,
   DecorateSkipCurrentLine,
   DecorateBracket,
   DecorateKeywords,
   DecorateFeature,
   DecorateScope,
};
