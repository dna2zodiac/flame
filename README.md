# flame
Source Code Comprehension Toolkits (SCCT)

```
#!/bin/bash

SELF=$(cd `dirname $0`/..; pwd)

cd $SELF
./node_modules/.bin/webpack

FLAME_STATIC_DIR=$SELF/dist/static \
FLAME_LOCALFS_BASEDIR=/path/to/source/code/root \
node $SELF/dist/index.js
```
