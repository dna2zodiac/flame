export const env = {
   name: 'flame',
   version: 20250121,
   db: makePromise(),
   db_: null,
   local: {},
};

export const local = env.local;

export function makePromise() {
   const obj = {};
   obj.promise = new Promise(function (r, e) {
      obj.r = r;
      obj.e = e;
   });
   return obj;
}

export function once(obj, name, fn) {
   obj.addEventListener(name, onceWrapper);
   function onceWrapper(evt) {
      obj.removeEventListener(name, onceWrapper);
      fn && fn(evt);
   }
}

export function multipleOnce(obj, events) {
   const hooks = [];
   events.forEach(item => {
      const genFn = onceWrapperGen(item.name, item.fn);
      obj.addEventListener(item.name, genFn);
   });

   function onceWrapperGen(name, fn) {
      return (evt) => {
         hooks.forEach((genFn, i) => {
            obj.removeEventListener(events[i].name, genFn);
         });
         fn && fn(evt);
      }
   }
}

export async function getStore(txMode, storeName) {
   // readonly / readwrite
   storeName = storeName || env.name;
   txMode = txMode || 'readwrite';
   if (env.db_) return getStoreApi();
   const req = window.indexedDB.open(env.name, env.version);
   once(req, 'upgradeneeded', function (evt) {
      const db = evt.target.result;
      // TODO: do upgrade in future; migrate schema and data
      if (db.objectStoreNames.contains(storeName)) return;
      console.log(`db created "${storeName}" ...`);
      db.createObjectStore(storeName);
   });
   multipleOnce(req, [{
      name: 'error',
      fn: function (evt) {
         env.db_ = null;
         env.db.e(evt.target.error);
      }
   }, {
      name: 'success',
      fn: function (evt) {
         env.db_ = evt.target.result;
         env.db.r(env.db_);
      }
   }]);
   await env.db.promise;
   return getStoreApi();

   function getStoreApi() {
      return env.db_.transaction([storeName], txMode).objectStore(storeName);
   }
}

export function get(key) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      multipleOnce(store.get(key), [{
         name: 'error',
         fn: function (evt) { e(evt); }
      }, {
         name: 'success',
         fn: function (evt) { r(evt.target.result); }
      }]);
   });
}

export function getMany(keys) {
   return Promise.all(keys.map(function (key) {
      return get(key);
   }));
}

export function set(key, value) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.put(value, key);
      multipleOnce(store.transaction, [{
         name: 'abort',
         fn: function (evt) { e(evt); }
      }, {
         name: 'complete',
         fn: function (evt) { r(evt); }
      }]);
   });
}

export function setMany(keyvals) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      keyvals.forEach(function (kv) {
         store.put(kv[1], kv[0]);
      });
      multipleOnce(store.transaction, [{
         name: 'abort',
         fn: function (evt) { e(evt); }
      }, {
         name: 'complete',
         fn: function (evt) { r(evt); }
      }]);
   });
}

export function del(key) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.delete(key);
      multipleOnce(store.transaction, [{
         name: 'abort',
         fn: function (evt) { e(evt); }
      }, {
         name: 'complete',
         fn: function (evt) { r(evt); }
      }]);
   });
}

export function delMany(keys) {
   return new Promise(async function (r, e) {
      const store = await getStore();
      keys.forEach(function (key) { store.delete(key); });
      multipleOnce(store.transaction, [{
         name: 'abort',
         fn: function (evt) { e(evt); }
      }, {
         name: 'complete',
         fn: function (evt) { r(evt); }
      }]);
   });
}

export function clr() {
   return new Promise(async function (r, e) {
      const store = await getStore();
      store.clear();
      multipleOnce(store.transaction, [{
         name: 'abort',
         fn: function (evt) { e(evt); }
      }, {
         name: 'complete',
         fn: function (evt) { r(evt); }
      }]);
   });
}

window._debugLocal = local;
