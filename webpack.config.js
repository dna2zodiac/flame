const i_path = require('path');
const i_uglifyjs_webpack_plugin = require('uglifyjs-webpack-plugin');
const i_javascript_obfuscator_plugin = require('webpack-obfuscator');

function getWebJs(path, outname) {
   return {
      // target: 'node',
      target: ['web', 'es5'],
      mode: 'production',
      module: {
         rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         }]
      },
      entry: path,
      optimization: {
         minimize: false,
      },
      resolve: {
         extensions: [ '.tsx', '.ts', '.js' ]
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
      module: {
         rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         }]
      },
      entry: path,
      optimization: {
         minimize: false,
      },
      resolve: {
         extensions: [ '.tsx', '.ts', '.js' ]
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
   getWebJs('./src/client/index.ts', 'index.js'),
   getWebJs('./src/client/worker/lang.ts', 'lang-worker.js'),
   getWebJs('./src/lazac/lang/cpp.ts', 'lazac/lang/cpp.js'),
   getNodeJs('./src/server/index.ts', 'index.js'),
   getNodeJs('./src/script/analyze.ts', 'script/analyze.js')
];
