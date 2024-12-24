const iFs = require('fs');
const iPath = require('path');

const {
   LocalFSContentProvider,
   LocalFSSearchProvider,
} = require('../content/localfs');
const {
   ModifiedZoektContentProvider,
   ModifiedZoektSearchProvider,
} = require('../content/modified_zoekt');

const PROJECT_LOAD_INTERVAL = 3600 * 1000;

/*
interface ContentProviderConfig {
   type: string; // localfs, modified_zoekt, ...
   base: string;
   auth?: string;
   inst?: any;
}

interface Config {
   contentProviders?: ContentProviderConfig[];
}
*/

class MixedContentAndSearchProvider {
   constructor(configPath) {
      this.config = {};
      this.loadConfigJson(configPath);
   }

   loadProjectList(self) {
      const cp = self.config.contentProviders;
      if (!cp || !cp.length) {
         console.log('[MixedContentAndSearchProvider] no provider found.');
         // TODO: do we panic here?
         return;
      }
      let count = 0, error = [];
      cp.forEach((config) => {
         if (!config || !config.inst || !config.inst.content) {
            error.push(`[${config.type}] ${config.base}: not initialized.`);
            incAndCheck();
            return;
         }
         config.inst.content.GetProjectList().then((plist) => {
            config.inst.projects = plist.map(
               (item) => item.name.substring(0, item.name.length-1)
            );
            incAndCheck();
         }, (err) => {
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

   loadConfigJson(path) {
      const json = JSON.parse(iFs.readFileSync(path).toString());
      this.config.contentProviders = json.contentProviders;
      this.config.contentProviders.forEach((config) => {
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
            const opt = { baseUrl: config.base };
            if (config.auth) opt.authentication = config.auth;
            const content = new ModifiedZoektContentProvider(opt);
            const searcher = new ModifiedZoektSearchProvider(content);
            config.inst = {
               content, searcher,
               projects: []
            };
         }
         default:
         }
      });
      this.loadProjectList(this);
   }

   determineProvider(project) {
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

   async GetFileContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetFileContent(project, path, rev);
   }

   async GetMetaData(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetMetaData(project, path, rev);
   }

   async GetProjectList() {
      const map = {};
      this.config.contentProviders.forEach((config) => {
         if (!config || !config.inst || !config.inst.projects) return;
         config.inst.projects.forEach(name => {
            map[name] = 1;
         });
      });
      return Object.keys(map).map(
         (name) => ({ name: `${name}/` })
      );
   }

   async GetDirectoryContent(project, path, rev) {
      if (!project) throw new Error('no project');
      if (!path || !path.endsWith('/')) throw new Error('invalid path');
      const config = this.determineProvider(project);
      if (!config) throw new Error('no project');
      return await config.inst.content.GetDirectoryContent(project, path, rev);
   }

   async SearchProject (query, options) {
      // TODO: refine it
      return { type: 'project', items: [] };
   }

   async SearchFile (query, options) {
      // TODO: refine it
      return { type: 'file', items: [] };
   }

   async SearchContent (query, options) {
      // TODO: refine it
      return { type: 'content', items: [] };
   }

   async Search (query, options) {
      // TODO: aggregate search result
      //       e.g. duplicated projects in different providers
      //            re-rank items from different providers
      options = options || {};
      const r = {
         matchQuery: query,
         items: [],
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

module.exports = {
   MixedContentAndSearchProvider,
};
