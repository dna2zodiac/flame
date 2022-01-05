import {
   LocalFSContentProvider,
   LocalFSSearchProvider
} from '../content/localfs';

const iUtil = require('../framework/util');

const localfs = new LocalFSContentProvider(
   process.env.FLAME_LOCALFS_BASEDIR || '/tmp'
);
const localfs_searcher = new LocalFSSearchProvider(
   localfs
);

export const api = {
   get: async (req: any, res: any, opt: any) => {
      // TODO: error handler
      const parts: string[] = opt.path;
      const urlObj = iUtil.parseUrl(req.url);
      if (!parts.length) {
         iUtil.rJson(res, await localfs.GetProjectList());
      } else if (parts.length === 1 && !parts[0]) {
         iUtil.rJson(res, await localfs.GetProjectList());
      } else {
         const project = parts.shift();
         const path = parts.join('/') || '/';
         try {
            if ('meta' in urlObj.query) {
               iUtil.rJson(res, await localfs.GetMetaData(
                  project, path
               ));
            } else if (path.endsWith('/')) {
               iUtil.rJson(res, await localfs.GetDirectoryContent(
                  project, path
               ));
            } else {
               iUtil.rJson(res, await localfs.GetFileContent(
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
      try {
         const srProject = await localfs_searcher.SearchProject(query, null);
         const srFile = await localfs_searcher.SearchFile(query, null);
         const srContent = await localfs_searcher.SearchContent(query, null);
         const r = {
            project: srProject,
            file: srFile,
            content: srContent,
         };
         iUtil.rJson(res, r);
      } catch(_) {
         iUtil.e500(res);
      }
   }, // search
};
