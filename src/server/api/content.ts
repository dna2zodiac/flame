import {
   LocalFSContentProvider,
   LocalFSSearchProvider,
} from '../content/localfs';
import {
   ModifiedZoektContentProvider,
   ModifiedZoektSearchProvider,
} from '../content/modified_zoekt';

const iUtil = require('../framework/util');

const localfs = new LocalFSContentProvider(
   process.env.FLAME_LOCALFS_BASEDIR || '/tmp'
);
const localfs_searcher = new LocalFSSearchProvider(
   localfs
);
/*const modified_zoekt = new ModifiedZoektContentProvider({
   baseUrl: process.env.FLAME_MODIFIED_ZOEKT_BASEURL
});
const modified_zoekt_searcher = new ModifiedZoektSearchProvider(
   modified_zoekt
);*/
const content = localfs;
const searcher = localfs_searcher;

export const api = {
   get: async (req: any, res: any, opt: any) => {
      // TODO: error handler
      const parts: string[] = opt.path;
      const urlObj = iUtil.parseUrl(req.url);
      if (!parts.length) {
         iUtil.rJson(res, await content.GetProjectList());
      } else if (parts.length === 1 && !parts[0]) {
         iUtil.rJson(res, await content.GetProjectList());
      } else {
         const project = parts.shift();
         const path = parts.join('/') || '/';
         try {
            if ('meta' in urlObj.query) {
               iUtil.rJson(res, await content.GetMetaData(
                  project, path
               ));
            } else if (path.endsWith('/')) {
               iUtil.rJson(res, await content.GetDirectoryContent(
                  project, path
               ));
            } else {
               iUtil.rJson(res, await content.GetFileContent(
                  project, path
               ));
            }
         } catch (err) {
            if (err && err.message === 'invalid path') {
               iUtil.e404(res);
            } else {
               iUtil.e500(res);
            }
         }
      }
   }, // get
   search: async (req: any, res: any, opt: any) => {
      // TODO: error handler
      const urlObj = iUtil.parseUrl(req.url);
      const query = urlObj.query.q;
      if (!query) {
         return iUtil.e400(res);
      }
      const options = Object.assign(
         { canceled: false }, opt
      );
      req.on('close', () => {
         options.canceled = true;
      });
      try {
         const r = <any>{};
         if (!options.canceled) {
            Object.assign(r, await searcher.Search(query, options));
         }
         iUtil.rJson(res, r.items?r:null);
      } catch(_) {
         iUtil.e500(res);
      }
   }, // search
};
