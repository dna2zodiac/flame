'use strict';

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
   (<any>self).Flame.Worker['lang-worker'].postMessage = (obj: any) => {
      return workerProcess(obj);
   };
}

function workerProcess(obj: any): Promise<any> {
   const res: any = { id: obj.id };
   return Promise.resolve(res);
}
