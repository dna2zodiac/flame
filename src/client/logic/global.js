const {TaskRunner} = require('../../share/task');

function LoadScript(path) {
   return new Promise((r, e) => {
      const script = document.createElement('script');
      script.src = path;
      script.addEventListener('load', _load);
      script.addEventListener('error', _error);
      document.body.appendChild(script);

      function _load(evt) {
         evt.target.removeEventListener('load', _load);
         evt.target.removeEventListener('error', _error);
         r(script);
      }
      function _error(evt) {
         evt.target.removeEventListener('load', _load);
         evt.target.removeEventListener('error', _error);
         e();
      }
   });
}

function TaskWorker(path) {
   this.resultMap = {};
   this.path = path;
   this.ready = false;
   const protocol = window.location.protocol;
   const that = this;
   if (protocol !== 'file:' && window.Worker) {
      // use worker to load e.g. name = lang-worker.js (/worker/lang.ts)
      this.worker = new Worker(path);
      this.sync = false;
   } else {
      // sync load lang-worker.js
      if (!window.Flame) window.Flame = {};
      if (!window.Flame.Worker) window.Flame.Worker = {};
      const name = this.path.split('/').pop().split('.').shift();
      window.Flame.Worker[name] = {};
      LoadScript(path).then((scriptDom) => {
         that.worker = scriptDom;
      }, () => {});
      this.sync = true;
      // patch importScripts if worker not available
      window.importScripts = LoadScript;
   }
}
TaskWorker.prototype = {
   Call: function(id, obj) {
      const that = this;
      if (!this.ready) {
         this.ready = true;
         if (!this.sync) {
            this.worker.addEventListener('message', (evt) => {
               if (!evt.data || !evt.data.id) return;
               const rid = evt.data.id;
               if (!that.resultMap[rid]) return;
               const map = that.resultMap[rid];
               map.r(evt.data);
               delete that.resultMap[rid];
            });
         }
      }
      return new Promise((r, e) => {
         const name = this.path.split('/').pop().split('.').shift();
         const data = Object.assign({ id }, obj);
         if (this.resultMap[id]) return e('working in progress');
         if (this.sync) {
            const api = window.Flame.Worker[name];
            if (!api) return e('script not loaded');
            this.resultMap[id] = 1;
            api.postMessage(data).then(obj => {
               delete that.resultMap[id];
               r(obj);
            }, err => {
               delete that.resultMap[id];
               e(err);
            });
         } else {
            this.resultMap[id] = { r, e };
            this.worker.postMessage(data);
         }
      });
   },
}

const Env = {
   task: new TaskRunner(),
   worker: new TaskWorker('lang-worker.js')
};

module.exports = {
   Env,
};
