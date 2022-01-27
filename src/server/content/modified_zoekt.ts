import {IContentProvider, ISearchProvider} from './interface';
import {IGNORE_DIRS} from '../../share/env';
import {Request} from '../curl';

const iUtil = require('../framework/util');
const iPath = require('path');
const iFile = require('fs');

export interface ModifiedZoektConfig {
   baseUrl: string;
   authentication?: any;
}

function buildPath(baseUrl: string, entry: string, params: any): string {
   // TODO: check a is null?
   const a = params.a;
   let url = `${baseUrl}${entry}?a=${encodeURIComponent(a)}`;
   Object.keys(params).forEach((key: string) => {
      const val = params[key];
      if (!val) return;
      url = `${url}&${
         encodeURIComponent(key)
      }=${
         encodeURIComponent(val)
      }`;
   });
   return url;
}

export class ModifiedZoektContentProvider implements IContentProvider {
   opt: ModifiedZoektConfig;

   constructor(opt: ModifiedZoektConfig) {
      this.opt = opt;
   }

   async GetFileContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const reqOpt: any = {};
      reqOpt.data_type = 'json';
      reqOpt.url = buildPath(this.opt.baseUrl, '/scmprint', {
         a: 'get',
         r: project,
         f: path,
         x: rev
      });
      if (this.opt.authentication) {
         reqOpt.headers = { Authorization: this.opt.authentication };
      }
      // TODO: how to deal with huge text file?
      const json = await Request(reqOpt);
      if (!json || json.error) throw json;
      // XXX: currently modified zoekt raise 403 error if it is binary file
      const obj = { binary: false, data: json.contents };
      // if (blob.indexOf('\x00') >= 0) obj.binary = true;
      return obj;
   }

   async GetMetaData(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      // XXX: not implemented yet
      return {};
   }

   async GetProjectList(): Promise<any> {
      const reqOpt: any = {};
      reqOpt.data_type = 'json';
      reqOpt.url = buildPath(this.opt.baseUrl, '/scmprint', {
         a: 'list',
      });
      if (this.opt.authentication) {
         reqOpt.headers = { Authorization: this.opt.authentication };
      }
      // TODO: how to deal with too many projects
      const json = await Request(reqOpt);
      // TODO: filter special folder like .git, ...
      if (!json || json.error) throw json;
      const list = json.filter((x: any) => !!x);
      return list.map(
         (name: string) => ({ name: `${name}/` })
      );
   };

   async GetDirectoryContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const reqOpt: any = {};
      reqOpt.data_type = 'json';
      reqOpt.url = buildPath(this.opt.baseUrl, '/scmprint', {
         a: 'get',
         r: project,
         f: path,
         x: rev
      });
      if (this.opt.authentication) {
         reqOpt.headers = { Authorization: this.opt.authentication };
      }
      // TODO: how to deal with huge folder?
      const json = await Request(reqOpt);
      if (!json || json.error) throw json;
      // TODO: filter special folder like .git, ...
      const list = json.contents.filter((x: any) => !!x);
      return list;
   }
}

export class ModifiedZoektSearchProvider implements ISearchProvider {
   content: IContentProvider;

   constructor(content: IContentProvider) {
      this.content = content;
   }

   async SearchProject (query: string, options: any): Promise<any> {
      return { type: 'project', items: [] };
   }

   async SearchFile (query: string, options: any): Promise<any> {
      return { type: 'file', items: [] };
   }

   async SearchContent (query: string, options: any): Promise<any> {
      return { type: 'content', items: [] };
   }

   async Search (query: string, options: any): Promise<any> {
      options = options || {};
      const r = {
         matchQuery: query,
         items: <any[]>[],
      };
      const reqOpt: any = {};
      reqOpt.data_type = 'json';
      const contentProvider = <ModifiedZoektContentProvider>this.content;
      reqOpt.url = buildPath(contentProvider.opt.baseUrl, '/search', {
         q: query
      });
      if (contentProvider.opt.authentication) {
         reqOpt.headers = { Authorization: contentProvider.opt.authentication };
      }
      // TODO: how to deal with huge folder?
      const json = await Request(reqOpt);
      if (!json || json.error) throw json;
      json.repositories && json.repositories.forEach((item: any) => {
         r.items.push({
            path: `/${item.name}/`,
            matches: []
         });
      });
      json.hits && json.hits.forEach((item: any) => {
         if (!item) return;
         // XXX: here skip duplicated items
         if (!item.matches) return;
         const obj = <any>{
            path: `/${item.repository}/${item.filename}`,
            matches: <any[]>[],
         };
         item.matches.forEach((match: any) => {
            if (!match) return;
            if (match.linenumber === 0) return;
            obj.matches.push({
               L: match.linenumber,
               T: match.text,
            });
         });
         r.items.push(obj);
      });
      return r;
   }
}
