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

const perl_extract_feature = {
   '"': [extract_string],
   '\'': [extract_char],
   '#': [extract_line_comment],
   /* TODO: regexp
            if (/foo/)       { ... }
            if ($a =~ /foo/) { ... }
            $a =~ s/"foo/bar/;
            $a =~ s/'foo/bar/g;
            /^\#   \s*
            line \s+ (\d+)   \s*
            (?:\s("?)([^"]+)\g2)? \s*
            $/x    */
   // '/': [],
   /* TODO: PODs
            =head1 Here There Be Pods!
            =item test
            multiple line
            =cut back to the compiler, nuff of this pod stuff!*/
   // '=': [],
   // TODO: __END__
   // foo at bzzzt line 201.
   // TODO: eval qq[\n#line 200 "foo bar"\ndie 'foo'];
   // TODO: copy code from ruby.ts to support extract
};

function extract_string(env: ParseEnv) {
   // TODO: check "The value of $key is $hash{$key}\n"
   return ExtractString(env, '"', '"', '\\');
}

function extract_char(env: ParseEnv) {
   // use Scalar::Util 'blessed';
   // bless $foo, 'Class';
   // print blessed( $bar ) // 'not blessed';
   return ExtractString(env, '\'', '\'', '\\');
}

function extract_line_comment(env: ParseEnv) {
   return ExtractComment(env, '#', '\n');
}

const perl_keywords = [
   // ref: https://perldoc.perl.org/perlcheat
];

const perl_decorate_feature = {
   // ref: https://perldoc.perl.org/perlcheat
};

export class PerlParser {
   constructor() {
   }

   Tokenize(text: string, opt: any): Token[] {
      // L, st, ed, name
      const env: ParseEnv = {
         curI: 0,
         text: text,
         tokens: <Token[]>[],
      };
      ExtractTokens(env, perl_extract_feature);
      env.curI = 0;
      DecorateScope(env, perl_decorate_feature);
      return env.tokens;
   }
}

if ((<any>self).document === undefined) {
   const flameObj = <any>self;
   flameObj.FlamePerlParser = PerlParser;
} else {
   const flameObj = <any>window;
   flameObj.FlamePerlParser = PerlParser;
}
