const iFile = require('fs');
const {BasicTextParser} = require('../common');

class TextParser {
   Tokenize(text) {
      const p = new BasicTextParser();
      return p.Parse(text).map(z => ({ T: z }));
   }
}

const parser = [
   'cpp', 'csharp', 'css',
   'golang', 'java', 'javascript',
   'kotlin', 'perl', 'python',
   'ruby', 'rust',
].reduce((a, x) => {
   const m = require(`../lang/${x}.js`);
   a[x] = m.Parser;
   return a;
}, {});
parser['text'] = TextParser;

function guessLang(path) {
   const ps = path.split('.');
   if (ps.length <= 1) return null;
   switch(ps.pop()) {
   case 'h': case 'hpp': case 'hh':
   case 'c': case 'cpp': case 'cc':
      return 'cpp';
   case 'py': return 'python';
   case 'js': case 'ts': return 'javascript';
   case 'java': return 'java';
   case 'go': return 'golang';
   case 'css': return 'css';
   case 'rt': return 'rust';
   case 'cs': return 'csharp';
   case 'kt': return 'kotlin';
   case 'rb': return 'ruby';
   case 'pl': return 'perl';
   }
   return 'text';
}

function parseLang(lang, code, res) {
   let p = null;
   if (p) {
      return new Promise((r, e) => {
         p.then(() => { r(_act()); }, e);
      });
   } else {
      return Promise.resolve(_act());
   }

   function _act() {
      const p = new parser[lang]();
      const tokens = p.Tokenize(code);
      res.tokens = tokens;
      return res;
   }
}

async function main() {
   const filepath = process.argv[2];
   const lang = guessLang(filepath);
   if (!lang) return 1;
   const code = iFile.readFileSync(filepath).toString();
   const res = {};
   await parseLang(lang, code, res);
   console.log(JSON.stringify(res.tokens, null, 3));
   return 0;
}

main().then((code) => process.exit(code));
