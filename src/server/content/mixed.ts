import * as iFs from 'fs';
import * as iPath from 'path';

import {IContentProvider, ISearchProvider} from './interface';
import {
   LocalFSContentProvider,
   LocalFSSearchProvider,
} from '../content/localfs';
import {
   ModifiedZoektContentProvider,
   ModifiedZoektSearchProvider,
} from '../content/modified_zoekt';

const PROJECT_LOAD_INTERVAL = 3600 * 1000;

interface ContentProviderConfig {
   type: string; // localfs, modified_zoekt, ...
   base: string;
   auth?: string;
   inst?: any;
}

interface Config {
   contentProviders?: ContentProviderConfig[];
}

export class MixedContentAndSearchProvider implements IContentProvider, ISearchProvider {
   config: Config;

   constructor(configPath: string) {
      this.config = {};
      this.loadConfigJson(configPath);
   }

   loadProjectList(self: MixedContentAndSearchProvider) {
      const cp = self.config.contentProviders;
      if (!cp || !cp.length) {
         console.log('[MixedContentAndSearchProvider] no provider found.');
         // TODO: do we panic here?
         return;
      }
      let count = 0, error = <any>[];
      cp.forEach((config: ContentProviderConfig) => {
         if (!config || !config.inst || !config.inst.content) {
            error.push(`[${config.type}] ${config.base}: not initialized.`);
            incAndCheck();
            return;
         }
         config.inst.content.GetProjectList().then((plist: any) => {
            config.inst.projects = plist.map(
               (item: any) => item.name.substring(0, item.name.length-1)
            );
            incAndCheck();
         }, (err: any) => {
            error.push(`[${config.type}] ${config.base}: not available; ${err ? err.toString() : '(unknown)'}`);
            config.inst.projects = [];
            incAndCheck();
         });
      });

      function incAndCheck() {
         count ++;
         if (count >= cp.length) {
            console.log(`[MixedContentAndSearchProvider] project list up-to-date.`);
            count = 0;
            setTimeout(self.loadProjectList, PROJECT_LOAD_INTERVAL, self);
         }
      }
   }

   loadConfigJson(path: string) {
      const json = JSON.parse(iFs.readFileSync(path).toString());
      this.config.contentProviders = json.contentProviders;
      this.config.contentProviders.forEach((config: ContentProviderConfig) => {
         if (!config) return;
         switch(config.type) {
         case 'localfs': {
            const content = new LocalFSContentProvider(config.base);
            const searcher = new LocalFSSearchProvider(content);
            config.inst = {
               content, searcher,
               projects: []
            };
            break;
         }
         case 'modified_zoekt': {
            const opt = <any>{ baseUrl: config.base };
            if (config.auth) opt.authentication = config.auth;
            const content = new ModifiedZoektContentProvider(opt);
            const searcher = new ModifiedZoektSearchProvider(content);
            config.inst = {
               content, searcher,
               projects: []
            };
         }
         default: return;
         }
      });
      this.loadProjectList(this);
   }

   determineProvider(project: string): ContentProviderConfig {
      const cp = this.config.contentProviders;
      for (let i = 0, n = cp.length; i < n ; i++) {
         const config = cp[i];
         if (!config || !config.inst || !config.inst.projects) continue;
         if (config.inst.projects.includes(project)) {
            return config;
         }
      }
      return null;
   }

   async GetFileContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetFileContent(project, path, rev);
   }

   async GetMetaData(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetMetaData(project, path, rev);
   }

   async GetProjectList(): Promise<any> {
      const map = <any>{};
      this.config.contentProviders.forEach((config: ContentProviderConfig) => {
         if (!config || !config.inst || !config.inst.projects) return;
         config.inst.projects.forEach((name: string) => {
            map[name] = 1;
         });
      });
      return Object.keys(map).map(
         (name: string) => ({ name: `${name}/` })
      );
   }

   async GetDirectoryContent(project: string, path: string, rev: string = null): Promise<any> {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetDirectoryContent(project, path, rev);
   }

   async SearchProject (query: string, options: any): Promise<any> {
      // TODO: refine it
      return { type: 'project', items: [] };
   }

   async SearchFile (query: string, options: any): Promise<any> {
      // TODO: refine it
      return { type: 'file', items: [] };
   }

   async SearchContent (query: string, options: any): Promise<any> {
      // TODO: refine it
      return { type: 'content', items: [] };
   }

   async Search (query: string, options: any): Promise<any> {
      // TODO: aggregate search result
      //       e.g. duplicated projects in different providers
      //            re-rank items from different providers
      options = options || {};
      const r = {
         matchQuery: query,
         items: <any[]>[],
      };
      const cp = this.config.contentProviders;
      for (let i = 0, n = cp.length; i < n; i++) {
         const config = cp[i];
         if (!config || !config.inst || !config.inst.searcher) continue;
         if (options.canceled) return r;
         const subr = await config.inst.searcher.Search(query, options);
         r.items = r.items.concat(subr.items);
      }
      return r;
   }
}
