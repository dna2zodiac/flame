import {
    TAG_BRACKET,
    TAG_KEYWORD,
    SearchNext,
    ParseEnv,
    Token
} from './common';


const common_left_bracket  = ['(', '{', '['];
const common_right_bracket = [')', '}', ']'];
const common_left_right_bracket_map = <any>{
   '(': ')', '{': '}', '[': ']', '<': '>'
};

export function TokensString(env: ParseEnv, st: number, ed: number): string {
   return env.tokens.slice(st, ed).map((x: Token) => x.T).join('');
}

export function DecorateSkipCurrentLine(env: ParseEnv): number {
   const st = env.curI;
   const ed = SearchNext(
      env.tokens, st+1,
      // comment | x.T === ''
      (x: Token) => !x.T || x.T !== '\n'
   );
   return ed - st + 1;
}

export function DecorateBracket(env: ParseEnv): number {
   let stack = <any[]>[];
   let i, n, ch, token;
   for (i = 0, n = env.tokens.length; i < n; i++) {
      token = env.tokens[i];
      ch = token.T;
      if (common_left_bracket.indexOf(ch) >= 0) {
         stack.push({i: i, ch: common_left_right_bracket_map[ch]});
         if (!token.deco) token.deco = {};
         token.deco.st = i;
         token.deco.tag = TAG_BRACKET[ch];
      } else if (common_right_bracket.indexOf(ch) >= 0) {
         let pair = stack.pop();
         if (pair.ch !== ch) {
             /* bracket not match; should not be here */
             // TODO: if here, what we can do?
         }
         const pairToken = env.tokens[pair.i];
         if (!pairToken.deco) pairToken.deco = {};
         pairToken.deco.ed = i+1;
      }
   }
   return env.tokens.length;
}

export function DecorateKeywords(env: ParseEnv, keywords: string[]): number {
   env.tokens.forEach((token) => {
      if (keywords.indexOf(token.T) >= 0) {
         if (!token.deco) token.deco = {};
         token.deco.tag = TAG_KEYWORD;
      }
   });
   return env.tokens.length;
}

export function DecorateFeature(env: ParseEnv, features: any): number {
   if (!features) return 0;
   let i, n, r;
   for (i = 0, n = features.length; i < n; i++) {
      r = features[i](env);
      if (r > 0) return r;
   }
   return 0;
}

export function DecorateScope(env: ParseEnv, feature_map: any, feature_default_fn: any = null): Token[] {
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