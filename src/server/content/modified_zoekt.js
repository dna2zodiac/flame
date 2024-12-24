const {IGNORE_DIRS} = require('../../share/env');
const {Request} = require('../curl');

const iUtil = require('../framework/util');
const iPath = require('path');
const iFile = require('fs');

/*
export interface ModifiedZoektConfig {
   baseUrl: string;
   authentication?: any;
}
*/

function buildPath(baseUrl, entry, params) {
   // TODO: check a is null?
   const a = params.a;
   let url = `${baseUrl}${entry}?a=${encodeURIComponent(a)}`;
   Object.keys(params).forEach((key) => {
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

class ModifiedZoektContentProvider {
   constructor(opt) {
      this.opt = opt;
   }

   async GetFileContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const reqOpt = {};
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
      // XXX: cause null object if meet control char like \x07 \x08 ...
      //      in nodeJS JSON parser, it should be '"\\u007"' (`"\u007"`)
      const json = await Request(reqOpt);
      if (!json || json.error) throw json;
      // XXX: currently modified zoekt raise 403 error if it is binary file
      const obj = { binary: false, data: json.contents };
      // if (blob.indexOf('\x00') >= 0) obj.binary = true;
      return obj;
   }

   async GetMetaData(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      // XXX: not implemented yet
      return {};
   }

   async GetProjectList() {
      const reqOpt = {};
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
      const list = json.filter((x) => !!x);
      return list.map(
         (name) => ({ name: `${name}/` })
      );
   };

   async GetDirectoryContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const reqOpt = {};
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
      const list = json.contents.filter((x) => !!x);
      return list;
   }
}

class ModifiedZoektSearchProvider {
   constructor(content) {
      this.content = content;
   }

   async SearchProject (query, options) {
      return { type: 'project', items: [] };
   }

   async SearchFile (query, options) {
      return { type: 'file', items: [] };
   }

   async SearchContent (query, options) {
      return { type: 'content', items: [] };
   }

   async Search (query, options) {
      options = options || {};
      const r = {
         matchQuery: query,
         items: [],
      };
      const reqOpt = {};
      reqOpt.data_type = 'json';
      const contentProvider = this.content;
      reqOpt.url = buildPath(contentProvider.opt.baseUrl, '/search', {
         q: query
      });
      if (contentProvider.opt.authentication) {
         reqOpt.headers = { Authorization: contentProvider.opt.authentication };
      }
      // TODO: how to deal with huge folder?
      const json = await Request(reqOpt);
      if (!json || json.error) throw json;
      json.repositories && json.repositories.forEach((item) => {
         r.items.push({
            path: `/${item.name}/`,
            matches: []
         });
      });
      json.hits && json.hits.forEach((item) => {
         if (!item) return;
         // XXX: here skip duplicated items
         if (!item.matches) return;
         const obj = {
            path: `/${item.repository}/${item.filename}`,
            matches: [],
         };
         item.matches.forEach((match) => {
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

module.exports = {
   ModifiedZoektContentProvider,
   ModifiedZoektSearchProvider,
};
