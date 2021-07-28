export interface IContentProvider {
   // { binary: true/false, data: '...' }
   // TODO: add dataRange for large file, e.g. { binary: true, data: '\x00\x00', range: [0,2] }
   GetFileContent (project: string, path: string, rev: string): Promise<any>;

   GetProjectList (): Promise<any>;

   // { items: [{ name: '...' }] }
   GetDirectoryContent (project: string, path: string, rev: string): Promise<any>;
}
