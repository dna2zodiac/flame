import {TaskRunner} from '../../share/task';

class TaskWorker {
   path: string;
   worker: any;
   sync: boolean;
   ready: boolean;
   resultMap: any = {};

   constructor(path: string) {
      this.path = path;
      this.ready = false;
      const protocol = window.location.protocol;
      if (protocol !== 'file:' && window.Worker) {
         // use worker to load e.g. name = lang-worker.js (/worker/lang.ts)
         this.worker = new Worker(path);
         this.sync = false;
      } else {
         // sync load lang-worker.js
         if (!(<any>window).Flame) (<any>window).Flame = <any>{};
         if (!(<any>window).Flame.Worker) (<any>window).Flame.Worker = <any>{};
         const name: string = this.path.split('/').pop().split('.').shift();
         (<any>window).Flame.Worker[name] = <any>{};
         const script = document.createElement('script');
         script.src = path;
         document.body.appendChild(script);
         this.worker = script;
         this.sync = true;
      }
   }

   Call(id: string, obj: any) {
      const that = this;
      if (!this.ready) {
         this.ready = true;
         if (!this.sync) {
            this.worker.addEventListener('message', (evt: any) => {
               if (!evt.data || !evt.data.id) return;
               const rid: any = evt.data.id;
               if (!that.resultMap[rid]) return;
               const map = that.resultMap[rid];
               map.r(evt.data);
               delete that.resultMap[rid];
            });
         }
      }
      return new Promise((r: any, e: any) => {
         const name: string = this.path.split('/').pop().split('.').shift();
         const data: any = Object.assign({ id }, obj);
         if (this.resultMap[id]) return e('working in progress');
         if (this.sync) {
            const api: any = (<any>window).Flame.Worker[name];
            if (!api) return e('script not loaded');
            this.resultMap[id] = 1;
            api.postMessage(data).then((obj: any) => {
               delete that.resultMap[id];
               r(obj);
            }, (err: any) => {
               delete that.resultMap[id];
               e(err);
            });
         } else {
            this.resultMap[id] = { r, e };
            this.worker.postMessage(data);
         }
      });
   }
}

export const Env: any = {
   task: new TaskRunner(),
   worker: new TaskWorker('lang-worker.js')
};
(<any>window).DebEnv = Env;
console.log((<any>window).DebEnv);
