const i_path = require('path');
const i_uglifyjs_webpack_plugin = require('uglifyjs-webpack-plugin');
const i_javascript_obfuscator_plugin = require('webpack-obfuscator');

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
         new i_uglifyjs_webpack_plugin({
            sourceMap: true,
            uglifyOptions: {
               ie8: false,
               ecma: 5,
               output: {
                  comments: false,
                  beautify: false
               },
               compress: true
            }
         }),
         new i_javascript_obfuscator_plugin({
            compact: true,
            transformObjectKeys: true,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            rotateUnicodeArray: true
         })
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
         new i_uglifyjs_webpack_plugin({
            sourceMap: true,
            uglifyOptions: {
               ie8: false,
               ecma: 6,
               output: {
                  comments: false,
                  beautify: false
               },
               compress: true
            }
         })
      ]
   };
}

module.exports = [
   getWebJs('./src/client/index.js', 'index.js'),
   getWebJs('./src/client/worker/lang.js', 'lang-worker.js'),

   getWebJs('./src/lazac/lang/c.js', 'lazac/lang/c.js'),
   getWebJs('./src/lazac/lang/cpp.js', 'lazac/lang/cpp.js'),
   getWebJs('./src/lazac/lang/java.js', 'lazac/lang/java.js'),
   getWebJs('./src/lazac/lang/python.js', 'lazac/lang/python.js'),
   getWebJs('./src/lazac/lang/javascript.js', 'lazac/lang/javascript.js'),
   getWebJs('./src/lazac/lang/golang.js', 'lazac/lang/golang.js'),
   getWebJs('./src/lazac/lang/csharp.js', 'lazac/lang/csharp.js'),
   getWebJs('./src/lazac/lang/ruby.js', 'lazac/lang/ruby.js'),
   getWebJs('./src/lazac/lang/rust.js', 'lazac/lang/rust.js'),
   getWebJs('./src/lazac/lang/css.js', 'lazac/lang/css.js'),
   getWebJs('./src/lazac/lang/kotlin.js', 'lazac/lang/kotlin.js'),

   getNodeJs('./src/server/index.js', 'index.js'),
   getNodeJs('./src/script/analyze.js', 'script/analyze.js')
];
