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

const kotlin_extract_feature = {
   '"': [extract_long_string, extract_string],
   '`': [extract_identifier_string],
   '\'': [extract_char],
   '/': [extract_line_comment, extract_multiline_comment]
};

function extract_long_string(env: ParseEnv) {
   /*
      val a = """Trimmed to margin text:
                |if(a > 1) {
                |    return a
                |}""".trimMargin()
    */
   return ExtractString(env, '"""', '"""', '\\');
}

function extract_string(env: ParseEnv) {
   // TODO: "sum of $a and $b is ${a + b}"
   //       "${s1.replace("is", "was")}, but now is $a"
   return ExtractString(env, '"', '"', '\\');
}

function extract_identifier_string(env: ParseEnv) {
   // @Test fun `ensure everything works`() { /*...*/ }
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

const kotlin_keywords = [
   // ref: https://kotlinlang.org/docs/keyword-reference.html
   // hard keywords
   'as', 'as?', 'break', 'class', 'continue', 'do',
   'else', 'false', 'for', 'fun', 'if', 'in', '!in',
   'interface', 'is', '!is', 'null', 'object', 'package',
   'return', 'super', 'this', 'throw', 'true', 'try',
   'typealias', 'typeof', 'val', 'var', 'when', 'while',
   // soft keywords
   'by', 'catch', 'constructor', 'delegate', 'dynamic',
   'field', 'file', 'finally', 'get', 'import', 'init',
   'param', 'property', 'receiver', 'set', 'setparam',
   'value', 'where',
   // modifier keywords
   'actual', 'abstract', 'annotation', 'cmpanion',
   'const', 'crossinline', 'data', 'enum', 'expect',
   'external', 'final', 'infix', 'inline', 'inner',
   'internal', 'lateinit', 'noinline', 'open', 'operator',
   'out', 'override', 'private', 'protected', 'public',
   'reified', 'sealed', 'suspend', 'tailrec', 'varag',
   // special identifiers
   'field', 'it',
];

const kotlin_decorate_feature = {
   // ref: https://kotlinlang.org/docs/packages.html
};

export class KotlinParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, kotlin_extract_feature);
      env.curI = 0;
      DecorateScope(env, kotlin_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlameKotlinParser = KotlinParser;
} else {
   const flameObj = <any>window;
   flameObj.FlameKotlinParser = KotlinParser;
}
