export class Task {
   name: string;
   /* { ... } + {
         onCondition: (data: any): boolean;
         // TODO: deal with retries
         // TODO: deal with cancellable task
      } */
   data: any;

   // here should be promise.resolve and promise.reject
   resolve: any;
   reject: any;

   constructor(name: string, data: any, resolve: any, reject: any) {
      this.name = name;
      this.data = data;
      this.resolve = resolve;
      this.reject = reject;
   }
}

export class TaskRunner {
   queue: Task[] = [];
   runner: any = {};
   actor: number = 1;

   constructor(opt: any = null) {
      opt = opt || {};
      if (opt.queue) {
         this.queue = <Task[]>opt.queue;
      }
      if (opt.actor) {
         this.actor = opt.actor || 1;
      }
   }

   Register(name: string, fn: any) {
      this.runner[name] = fn;
   }

   Push(name: string, data: any) {
      return new Promise((r, e) => {
         const task = new Task(name, data, r, e);
         this.queue.push(task);
         this.run();
      });
   }

   run() {
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
            (out: any) => {
               task.resolve(out);
               that.actor ++;
               that.run();
            }, (err: any) => {
               task.reject(err);
               that.actor ++;
               that.run();
            }
         );
      } catch (err: any) {
         task.reject(err);
         this.actor ++;
         this.run();
      }
   }
}
