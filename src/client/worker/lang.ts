'use strict';

const env = <any>{
   cpp: false,
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
   const tmp: any = {};
   switch (obj.cmd) {
   case 'cpp':
      if (!env.cpp) {
         tmp.p = importScripts('./lazac/lang/cpp.js');
         env.cpp = true;
      }
      if (tmp.p) {
         return new Promise((r: any, e: any) => {
            tmp.p.then(() => { parseCpp(obj, res).then(r, e); }, e);
         });
      } else {
         return parseCpp(obj, res);
      }
   }
   return Promise.resolve(res);
}

function parseCpp(obj: any, res: any): Promise<any> {
   const parser = new (<any>self).FlameCppParser();
   const tokens = parser.Tokenize(obj.text).filter((x: any) => !!x.name);
   res.tokens = tokens;
   return Promise.resolve(res);
}
