import {Ajax} from './util';

function debugRepeat(ch: string, n: number = 1) {
   let str = '';
   for (let i = 0; i < n; i++) str += ch;
   return str;
}

function FakeAjax(opt: any, data: any = null, err: any = null) {
   return new FakeRequest(data, err);
}

class FakeRequest {
   data: any = null;
   err: any = null;
   constructor(data: any, err: any = null) {
      this.data = data;
      this.err = err;
   }

   Req() {
      if (this.data) {
         return Promise.resolve(this.data);
      } else {
         return Promise.reject(this.err);
      }
   }

   Cacnel() {}
}

export const DataClient = {
   User: {
      CheckLogin: () => {
         return FakeAjax(null, true, null);
      }, // CheckLogin
   }, // User
   Project: {
      List: () => {
         const list = [];
         for (let i = 0, n = 50; i < n; i++)
            list.push({ name: 'test' + i + '/' });
         return FakeAjax(null, list, null);
      }, // List
      GetDirectoryContents: (path: string) => {
         if (!path || path === '/') return DataClient.Project.List();
         if (path && path.split('/').length > 20) {
            return FakeAjax(null, [
               { name: 'README.md' },
               { name: 'test.js' },
            ], null);
         }
         return FakeAjax(null, [
            { name: 'next/' },
            { name: 'package.json' },
            { name: 'README.md' },
         ], null);
      }, // GetDirectoryContents
      GetFileContents: (path: string) => {
         return FakeAjax(null, {
            binary: false,
            data: (
               'This is a test readme file.\n\ntest for l' +
               debugRepeat('o', 200) +
               'ng line\n\n' +
               debugRepeat('\n', 70) +
               'test for scrollable'
            )
         }, null);
      }, // GetFileContents
      GetMetadata: (path: string, opt: any) => {
         // TODO: load partially / on demand
         return FakeAjax(null, {
            // partial flag, [startLineNumber, endLineNumber]
            range: [1, 500],
            comment: [
               { user: 'flame', markdown: '`test` http://test.com/1', linenumber: 8 },
               { user: 'test', markdown: '`test` https://test.com/safe?test=1' }
            ],
            symbol: [
               { name: 'test', type: 'variable', linenumber: 5 }
            ],
            linkage: [
               {
                  ref: 'test', linenumber: 2,
                  in: { link: '/test0/README.md', tag: ['definition'], linenumber: 6 }
               },
               {
                  ref: 'test', linenumber: 2,
                  out: { link: '/test4/README.md', tag: ['reference'], linenumber: 20 }
               }
            ]
         }, null);
      }, // GetMetadata
      Search: (query: string, n: number = 50) => {
         return FakeAjax(null, {
            matchRegexp: '[Tt]his is',
            items: [
               { path: '/test1/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' },
                  { L: 5, T: 'This is a test readme file and it is a loooooooooooooooooong line here.' }
               ] },
               { path: '/test2/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' }
               ] },
               { path: '/test3/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' }
               ] }
            ]
         }, null);
      }, // Search
   }, // Project
   Topic: {
      GetMetadata: (topic: string) => {
         return FakeAjax(null, {
            name: 'this is a test topic',
            scope: 'public',
            item: [
               { path: '/test0/README.md', linenumber: 7 },
               { path: '/test1/package.json' }
            ],
            comment: [
               { user: 'flame', markdown: 'test topic' },
               { user: 'test', markdown: 'topic test' }
            ]
         }, null);
      }, // GetMetadata
   } // Topic
};
