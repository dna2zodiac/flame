export interface IContentProvider {
   // { binary: true/false, data: '...' }
   // TODO: add dataRange for large file, e.g. { binary: true, data: '\x00\x00', range: [0,2,500] }
   GetFileContent (project: string, path: string, rev: string): Promise<any>;

   GetProjectList (): Promise<any>;

   // { items: [{ name: '...' }] }
   GetDirectoryContent (project: string, path: string, rev: string): Promise<any>;

   // { lines: [{id:<lineNumber>, items: [{st, ed, link, ...}, ...]}, ...] }
   // TODO: add dataRange for large file
   GetMetaData (project: string, path: string, rev: string): Promise<any>;
}

export interface ISearchProvider {
   Search (query: string, options: any): Promise<any>;

   SearchProject (query: string, options: any): Promise<any>;
   SearchFile (query: string, options: any): Promise<any>;
   SearchContent (query: string, options: any): Promise<any>;
}
