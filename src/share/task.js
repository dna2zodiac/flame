function Task(name, data, resolve, reject) {
   /* data { ... } + {
         onCondition: (data: any): boolean;
         // TODO: deal with retries
         // TODO: deal with cancellable task
      } */
   // promise.resolve and promise.reject
   this.name = name;
   this.data = data;
   this.resolve = resolve;
   this.reject = reject;
}

function TaskRunner(opt) {
   this.queue = [];
   this.runner = {};
   this.actor = 1;

   opt = opt || {};
   if (opt.queue) {
      this.queue = opt.queue;
   }
   if (opt.actor) {
      this.actor = opt.actor || 1;
   }
}
TaskRunner.prototype = {
   Register: function(name, fn) {
      this.runner[name] = fn;
   },

   Push: function(name, data) {
      return new Promise((r, e) => {
         const task = new Task(name, data, r, e);
         this.queue.push(task);
         this.run();
      });
   },

   run: function() {
      if (this.actor <= 0) return;
      if (!this.queue.length) return;
      this.actor --;
      const task = this.queue.shift();
      try {
         if (!task.name) {
            throw 'UnknownTask';
         }
         const runner = this.runner[task.name];
         if (!runner) {
            throw 'NoSupportedRunner';
         }
         if (task.data && task.data.onCondition && !task.data.onCondition(task.data)) {
            this.queue.push(task);
            this.actor ++;
            if (this.queue.length === 1) {
               // if only one task, delay 100ms and try onCondition again
               setTimeout((self) => self.run(), 100, this);
            } else {
               this.run();
            }
            return;
         }
         const that = this;
         runner(task.data).then(
            (out) => {
               task.resolve(out);
               that.actor ++;
               that.run();
            }, (err) => {
               task.reject(err);
               that.actor ++;
               that.run();
            }
         );
      } catch (err) {
         task.reject(err);
         this.actor ++;
         this.run();
      }
   },
};

module.exports = {
   Task,
   TaskRunner,
};
