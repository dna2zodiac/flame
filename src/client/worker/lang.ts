'use strict';

const env = <any>{
   c: false,
   cpp: false,
   java: false,
   python: false,
   golang: false,
   csharp: false,
   javascript: false,
   ruby: false,
};

const that = self;
if ((<any>self).document === undefined) {
   self.addEventListener('message', (evt: any) => {
      const obj: any = evt.data;
      workerProcess(obj).then((res: any) => {
         that.postMessage(res, null);
      }, (err: any) => {
         that.postMessage({ id: obj.id, err }, null);
      });
   });
} else {
   (<any>self).Flame = <any>((<any>self).Flame || {});
   (<any>self).Flame.Worker['lang-worker'].postMessage = (obj: any) => {
      return workerProcess(obj);
   };
}

function workerProcess(obj: any): Promise<any> {
   const res: any = { id: obj.id };
   switch (obj.cmd) {
   case 'c': return parseLang('c', 'FlameCParser', obj, res);
   case 'cpp': return parseLang('cpp', 'FlameCppParser', obj, res);
   case 'java': return parseLang('java', 'FlameJavaParser', obj, res);
   case 'python': return parseLang('python', 'FlamePythonParser', obj, res);
   case 'golang': return parseLang('golang', 'FlameGolangParser', obj, res);
   case 'javascript': return parseLang('javascript', 'FlameJavascriptParser', obj, res);
   case 'csharp': return parseLang('csharp', 'FlameCSharpParser', obj, res);
   case 'ruby': return parseLang('ruby', 'FlameRubyParser', obj, res);
   }
   return Promise.resolve(res);
}

function parseLang(lang: string, klass: string, obj: any, res: any): Promise<any> {
   let p: any = null;
   if (!env[lang]) {
      p = importScripts(`./lazac/lang/${lang}.js`);
      env[lang] = true;
   }
   if (p) {
      return new Promise((r: any, e: any) => {
         p.then(() => { r(_act()); }, e);
      });
   } else {
      return Promise.resolve(_act());
   }

   function _act() {
      const parser = new (<any>self)[klass]();
      const tokens = parser.Tokenize(obj.text).filter((x: any) => !!x.name);
      res.tokens = tokens;
      return res;
   }
}
