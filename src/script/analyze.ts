import {AnalyzeProject} from '../share/analyzer';

const srcRoot = process.argv[2];
const outDir = process.argv[3];

if (process.argv.length < 4) {
   console.log(`usage: ${process.argv[0]} ${process.argv[1]} srcRoot outDir`);
   process.exit();
}

AnalyzeProject(
   srcRoot, outDir, null
).then(
   () => console.log('done'),
   (err: any) => console.error('e400', err)
).catch((err: any) => console.error('e500', err));
