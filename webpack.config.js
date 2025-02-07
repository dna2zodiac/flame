const i_path = require('path');

function getWebJs(path, outname) {
   return {
      // target: 'node',
      target: ['web', 'es5'],
      mode: 'production',
      entry: path,
      optimization: {
         minimize: false,
      },
      output: {
         filename: outname,
         path: i_path.resolve(__dirname, 'dist', 'static')
      },
      plugins: [
      ]
   };
}

function getNodeJs(path, outname) {
   return {
      target: 'node',
      mode: 'production',
      entry: path,
      optimization: {
         minimize: false,
      },
      output: {
         filename: outname,
         path: i_path.resolve(__dirname, 'dist')
      },
      plugins: [
      ]
   };
}

module.exports = [
   getWebJs('./src/client/index.js', 'index.js'),
   getWebJs('./src/client/worker/lang.js', 'lang-worker.js'),

   getWebJs('./src/lazac/lang/c.js', 'lazac/lang/c.js'),
   getWebJs('./src/lazac/lang/cpp.js', 'lazac/lang/cpp.js'),
   getWebJs('./src/lazac/lang/csharp.js', 'lazac/lang/csharp.js'),
   getWebJs('./src/lazac/lang/css.js', 'lazac/lang/css.js'),
   getWebJs('./src/lazac/lang/golang.js', 'lazac/lang/golang.js'),
   getWebJs('./src/lazac/lang/java.js', 'lazac/lang/java.js'),
   getWebJs('./src/lazac/lang/javascript.js', 'lazac/lang/javascript.js'),
   getWebJs('./src/lazac/lang/kotlin.js', 'lazac/lang/kotlin.js'),
   getWebJs('./src/lazac/lang/perl.js', 'lazac/lang/perl.js'),
   getWebJs('./src/lazac/lang/python.js', 'lazac/lang/python.js'),
   getWebJs('./src/lazac/lang/ruby.js', 'lazac/lang/ruby.js'),
   getWebJs('./src/lazac/lang/rust.js', 'lazac/lang/rust.js'),

   getNodeJs('./src/server/index.js', 'index.js'),
   getNodeJs('./src/script/analyze.js', 'script/analyze.js')
];
