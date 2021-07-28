import {LocalFSContentProvider} from '../content/localfs';

const iUtil = require('../framework/util');

const localfs = new LocalFSContentProvider(
   process.env.FLAME_LOCALFS_BASEDIR || '/tmp'
);

export const api = {
   get: async (req: any, res: any, opt: any) => {
      // TODO: error handler
      const parts: string[] = opt.path;
      if (!parts.length) {
         iUtil.rJson(res, await localfs.GetProjectList());
      } else if (parts.length === 1 && !parts[0]) {
         iUtil.rJson(res, await localfs.GetProjectList());
      } else {
         const project = parts.shift();
         const path = parts.join('/') || '/';
         if (path.endsWith('/')) {
            iUtil.rJson(res, await localfs.GetDirectoryContent(
               project, path
            ));
         } else {
            iUtil.rJson(res, await localfs.GetFileContent(
               project, path
            ));
         }
      }
   }
};
