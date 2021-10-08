import {AnalyzeProject} from '../share/analyzer';
//import {TrigramSearch} from '../share/plugin/analyzer/search_searcher';

const srcRoot = process.argv[2];
const outDir = process.argv[3];
const query = process.argv[4];

if (process.argv.length < 4) {
   console.log(`usage: ${process.argv[0]} ${process.argv[1]} srcRoot outDir [query]`);
   process.exit();
}

AnalyzeProject(
   srcRoot, outDir, null
).then(
   () => {
      console.log('index done.');
      /*if (query) {
         TrigramSearch(query, outDir, null).then(
            (r: any) => console.log('search results:', r),
            (err: any) => console.error('e40x', err)
         ).catch((err: any) => console.error('e50x', err));
      }*/
   },
   (err: any) => console.error('e400', err)
).catch((err: any) => console.error('e500', err));


