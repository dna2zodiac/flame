import { ParseEnv, SearchNextSkipSpacen, TAG_STRING, Token, TokenDecoration } from '../common';
import { DecorateScope } from '../decorator';
import {
   ExtractString,
   ExtractComment,
   ExtractTokens,
} from '../extractor';

const go_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '`': [extract_raw_string],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_string(env: ParseEnv) {
   return ExtractString(env, '"', '"', '\\');
}

function extract_raw_string(env: ParseEnv) {
   return ExtractString(env, '`', '`', '\\');
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

const go_keywords = [
   // ref:
   // - https://go.dev/ref/spec#Keywords
   'break', 'default', 'func', 'interface', 'select', 'var',
   'case', 'defer', 'go', 'map', 'struct', 'chan', 'else',
   'goto', 'package', 'switch', 'const', 'fallthrough', 'if',
   'range', 'type', 'continue', 'for', 'import', 'return'
];

const go_decorate_feature = {
   'import': [decoraete_import],
};

function detect_line_import(tokens: Token[], index: number): any {
   // import . "fmt"
   // import _ "fmt"
   // import xxx "fmt"
   // import "fmt"
   let position = <any>{
      startIndex: index,
      endIndex: index+1
   };
   let token = tokens[index];
   let alias = null;
   if (token.tag !== TAG_STRING) {
      alias = [index, index+1];
      index = SearchNextSkipSpacen(tokens, index+1);
      token = tokens[index];
      if (!token) return null;
   }
   if (token.tag !== TAG_STRING) return null;
   let name = [index];
   position.alias = alias;
   position.name = name;
   position.endIndex = index + 1;
   position.skipIndex = index;
   position.skipIndex = SearchNextSkipSpacen(
      tokens, position.skipIndex+1
   );
   token = tokens[position.skipIndex];
   // import ("fmt"; . "fmt")
   if (token && token.T === ';') {
      position.skipIndex = SearchNextSkipSpacen(
         tokens, position.skipIndex+1
      );
   }
   return position;
}

function decoraete_import(env: ParseEnv) {
   // import fmt "fmt"
   // import (
   //    _ "xxx/sql"
   // )
   let st = env.curI, ed = st;
   const importToken = env.tokens[st];
   ed = SearchNextSkipSpacen(env.tokens, ed+1);
   let token = env.tokens[ed];
   let import_list = [];
   let position;
   if (!token) return 0;
   if (token.T === '(') {
      ed = SearchNextSkipSpacen(env.tokens, ed+1);
      do {
         position = detect_line_import(env.tokens, ed);
         import_list.push([
            position.startIndex,
            position.endIndex,
            {
               name: position.name,
               alias: position.alias
            }
         ]);
         ed = position.skipIndex;
         token = env.tokens[position.skipIndex];
      } while (token && token.T !== ')');
      ed = position.endIndex;
   } else {
      position = detect_line_import(env.tokens, ed);
      import_list.push([
         position.startIndex,
         position.endIndex,
         {
            name: position.name,
            alias: position.alias
         }
      ]);
      ed = position.endIndex;
   }
   const deco = <TokenDecoration>{
      st, ed,
      tag: 'import',
      data: import_list,
   };
   deco.st = st;
   deco.ed = ed;
   importToken.deco = deco;
   return ed - st;
}

export class GolangParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, go_extract_feature);
      env.curI = 0;
      DecorateScope(env, go_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameGolangParser = GolangParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameGolangParser = GolangParser;
}
