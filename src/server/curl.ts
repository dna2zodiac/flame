import * as iPath from 'path';
import * as iHttps from 'https';
import * as iHttp from 'http';
import * as iUrl from 'url';

const iUtils = require('./framework/util');

function intdiv(a: number, b: number): number {
   return ~~(a/b);
}

const decoder = <any>{
   'n/a': (res: any, r: any) => r(res),
   json: (res: any, r: any, e: any) => {
      return iUtils.readRequestJson(res).then(r, e);
   },
   plain: (res: any, r: any, e: any) => {
      return iUtils.readRequestBinary(res).then(
         (buf: any) => r(buf.toString()), e
      );
   },
};

export async function Request(options: any): Promise<any> {
   return new Promise ((r: any, e: any) => {
      if (!options) return e();
      let curl, i, req;
      const follow_redirect = !!options.follow_redirect;
      const url = iUrl.parse(options.url);
      let path = url.href.split('://')[1];
      i = path.indexOf('/');
      if (i < 0) {
         // https://test?test => url.parse => https://test/?test
         path = '/';
      } else {
         path = path.substring(i);
      }
      let curl_options: any = {
         hostname: url.hostname,
         port: url.port,
         path: path,
         method: options.method || 'GET',
      };
      switch (url.protocol) {
      case 'https:':
         curl = iHttps;
         curl_options.port = url.port || 443;
         break;
      case 'http:':
         curl = iHttp;
         curl_options.port = url.port || 80;
         break;
      }
      let data_type = options.data_type || 'n/a';
      if (options.headers) curl_options.headers = options.headers;
      if (!curl_options.headers) curl_options.headers = <any>{};
      curl_options.headers['host'] = curl_options.hostname;
      curl_options.headers['user-agent'] = 'curl/7.54.0';
      curl_options.headers['accept'] = '*/*';
      curl_options.headers['connection'] = 'close';
      req = curl.request(curl_options, (res: any) => {
         switch (intdiv(res.statusCode, 100)) {
         case 1:
            // TODO: process websocket here
            return e(res);
         case 2:
            break;
         case 3:
            if (follow_redirect) {
               options.url = res.headers.location;
               if (options.url.indexOf('://') < 0) {
                  options.url = url.protocol + '//' + iPath.join(url.host, options.url);
               }
               return Request(options).then(r, e);
            }
            break;
         case 4:
         case 5:
         default:
            return e(res);
         }
         try {
            decoder[data_type](res, r, e);
         } catch(e) {
            console.error('[server.curl#request]', e);
         }
      });
      if (options.data) {
         req.write(options.data);
      } else if (options.json) {
         req.write(JSON.stringify(options.json));
      }
      req.on('error', e);
      req.end();
   });
}
