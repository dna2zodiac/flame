// obj: p(path), p_(absPath),
//      h(oldHash), h_(currentHash),
//      a(action), m(mtime), b(isBinary)
async function IncFileLv(obj, metaRoot) {
   console.log(obj, metaRoot);
}

async function ModFileLv(obj, metaRoot) {
   console.log(obj, metaRoot);
}

async function DecFileLv(obj, metaRoot) {
   console.log(obj, metaRoot);
}

async function IncProjectLv(obj, metaRoot) {
   console.log(obj, metaRoot);
}

async function DecProjectLv(obj, metaRoot) {
   console.log(obj, metaRoot);
}

module.exports = {
   IncFileLv,
   ModFileLv,
   DecFileLv,
   IncProjectLv,
   DecProjectLv,
};
