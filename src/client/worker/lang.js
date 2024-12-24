const {SyntaxItem} = require('../../share/common');
const {
   TAG_STRING,
   TAG_COMMENT,
   TAG_REGEX,
   Token,
} = require('../../lazac/common');

const env = {
   c: false,
   cpp: false,
   java: false,
   python: false,
   golang: false,
   csharp: false,
   javascript: false,
   css: false,
   rust: false,
   kotlin: false,
   ruby: false,
};

const that = self;
if (self.document === undefined) {
   self.addEventListener('message', (evt) => {
      const obj = evt.data;
      workerProcess(obj).then((res) => {
         that.postMessage(res, null);
      }, (err) => {
         that.postMessage({ id: obj.id, err }, null);
      });
   });
} else {
   self.Flame = self.Flame || {};
   self.Flame.Worker['lang-worker'].postMessage = obj => workerProcess(obj);
}

function workerProcess(obj) {
   const res = { id: obj.id };
   switch (obj.cmd) {
   case 'c': return parseLang('c', 'FlameCParser', obj, res);
   case 'cpp': return parseLang('cpp', 'FlameCppParser', obj, res);
   case 'java': return parseLang('java', 'FlameJavaParser', obj, res);
   case 'python': return parseLang('python', 'FlamePythonParser', obj, res);
   case 'golang': return parseLang('golang', 'FlameGolangParser', obj, res);
   case 'javascript': return parseLang('javascript', 'FlameJavascriptParser', obj, res);
   case 'csharp': return parseLang('csharp', 'FlameCSharpParser', obj, res);
   case 'css': return parseLang('css', 'FlameCssParser', obj, res);
   case 'rust': return parseLang('rust', 'FlameRustParser', obj, res);
   case 'kotlin': return parseLang('kotlin', 'FlameKotlinParser', obj, res);
   case 'ruby': return parseLang('ruby', 'FlameRubyParser', obj, res);
   }
   return Promise.resolve(res);
}

function parseLang(lang, klass, obj, res) {
   let p = null;
   if (!env[lang]) {
      p = importScripts(`./lazac/lang/${lang}.js`);
      env[lang] = true;
   }
   if (p) {
      return new Promise((r, e) => {
         p.then(() => { r(_act()); }, e);
      });
   } else {
      return Promise.resolve(_act());
   }

   function _act() {
      const parser = new self[klass]();
      const tokens = ConvertTokenToSyntaxItem(
         parser.Tokenize(obj.text)
      ).filter(
         x => !!x.name
      );
      res.tokens = tokens;
      return res;
   }
}

function ConvertTokenToSyntaxItem(tokens) {
   console.log('convert', tokens);
   const rs = [];
   let L = 0, col = 0;
   for (let i = 0, n = tokens.length; i < n; i++) {
      const token = tokens[i];
      const T = token.tag === TAG_COMMENT? token.data:token.T;
      const multipleLines = (
         token.tag === TAG_STRING ||
         token.tag === TAG_REGEX ||
         token.tag === TAG_COMMENT
      );
      if (multipleLines) {
         // "abc\ -> "abc\\\ndef"
         // def"           ^^--- new line
         const lines = T.split('\n');
         const n = lines.length - 1;
         lines.forEach((line) => {
            rs.push({
               L: L,
               st: col,
               ed: col + line.length,
               name: token.tag,
            });
            L ++;
            col += line.length;
            if (n) col = 0;
         });
         L --;
      } else {
         rs.push({
            L: L,
            st: col,
            ed: col + T.length,
            name: null,
         });
         col += T.length;
         if (T === '\n') {
            L ++;
            col = 0;
         }
      }
   }
   return rs;
}
