const i_path = require('path');
const i_uglifyjs_webpack_plugin = require('uglifyjs-webpack-plugin');

module.exports = [{
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
   entry: './src/client/index.ts',
   optimization: {
      minimize: false,
   },
   resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
   },
   output: {
      filename: 'index.js',
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
      })
   ]
}, {
   target: 'node',
   mode: 'production',
   module: {
      rules: [{
         test: /\.tsx?$/,
         use: 'ts-loader',
         exclude: /node_modules/
      }]
   },
   entry: './src/server/index.ts',
   optimization: {
      minimize: false,
   },
   resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
   },
   output: {
      filename: 'index.js',
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
}];
