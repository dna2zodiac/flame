export function ElemEmpty (elem: HTMLElement) {
   while(elem.children.length) elem.removeChild(elem.children[0]);
   elem.innerHTML = '';
   return elem;
}

export function ElemAppendText(elem: HTMLElement, text: string) {
   elem.appendChild(document.createTextNode(text));
   return elem;
}

export function ElemAppendHtml(elem: HTMLElement, html: string) {
   elem.innerHTML += html;
   return elem;
}

export function HtmlEncode(text: string): string {
   text = text.replace(/&/g, '&amp;');
   text = text.replace(/</g, '&lt;');
   text = text.replace(/>/g, '&gt;');
   return text;
}

export function ElemSafeAppendHtml(elem: HTMLElement, html: string): boolean {
   // XXX: const fg = document.createDocumentFragment();
   const fg = document.createElement('div');
   fg.innerHTML = html;
   if (!guard(fg)) {
      return false;
   }
   elem.innerHTML += html;
   return true;

   function guard(elem: Element) {
      switch (elem.tagName.toLowerCase()) {
      case 'script':
      case 'iframe':
      // TODO: embed, ...
         return false;
      }
      const n = elem.children.length;
      for (let i = 0; i < n; i++) {
         const subelem = elem.children[i];
         const r = guard(subelem);
         if (!r) return false;
      }
      return true;
   }
}

export function ElemDivMessage(elem: HTMLElement, message: string, color: string = null, icon: string = null) {
   const div = document.createElement('div');
   if (icon) {
      div.appendChild(ElemIcon(icon, 14, 14));
   }
   ElemAppendText(div, message);
   ElemEmpty(elem);
   div.className = 'item item-' + (color || 'blue');
   elem.appendChild(div);
}

export function ElemFlash(elem: HTMLElement, count: number = 5) {
   let sw = true;
   _flash();

   function _flash() {
      if (count <= 0) return;
      if (sw) {
         elem.style.removeProperty('opacity');
      } else {
         elem.style.opacity = '0.1';
      }
      sw = !sw;
      count --;
      setTimeout(_flash, 200);
   }
}

export function ElemIcon(src: string, w: number, h: number) {
   const img = document.createElement('img');
   img.src = src;
   img.style.width = `${w}px`;
   img.style.height = `${h}px`;
   return img;
}

export function PageLoading(zIndex: number = 0) {
   let div = <HTMLElement>document.querySelector('.mask');
   if (!div) {
      div = document.createElement('div');
      div.className = 'mask';
      document.body.appendChild(div);
   }
   div.style.display = 'block';
   if (zIndex) {
      div.style.zIndex = `${zIndex}`;
   }
}

export function PageLoaded() {
   const div = <HTMLElement>document.querySelector('.mask');
   if (!div) return;
   div.style.display = 'none';
}

export function UuidUpdate(jsonData: any) {
   const obj = jsonData?JSON.parse(jsonData):{};
   if (obj.sessionId) CookieSet('uuid', obj.sessionId);
}

export function IsMobileBrowser() {
   const userAgent = (navigator.userAgent || navigator.vendor || (<any>window).opera || '').toLowerCase();
   if (/android|iphone|ipod|kindle/.test(userAgent)) return true;
   return false;
}

export function TriggerDownload(url: string, name: string) {
   const link = document.createElement("a");
   link.download = name;
   link.href = url;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

export function TriggerDownloadWithFetch(url: string, name: string) {
   window.fetch(url).then((res: any) => {
      res.blob().then((blob: any) => {
         const url = window.URL.createObjectURL(blob);
         TriggerDownload(url, name);
         window.URL.revokeObjectURL(url);
      });
   });
}

export function CopyToClipboard(text: string) {
   const textArea = document.createElement('textarea');
   textArea.style.position = 'fixed';
   textArea.style.top = '0px';
   textArea.style.left = '0px';
   textArea.value = text;
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   try { document.execCommand('copy'); } catch (err: any) {}
   document.body.removeChild(textArea);
}

export function CookieGet(): any {
   try {
      return JSON.parse(localStorage.getItem('cookie') || '{}');
   } catch (err: any) {
      return {};
   }
}

export function CookieSet(key: string, value: any) {
   const obj = CookieGet();
   obj[key] = value;
   localStorage.setItem('cookie', JSON.stringify(obj));
}

export function CookieErase(key: string = null) {
   if (!key) {
      localStorage.removeItem('cookie');
      return;
   }
   var obj = CookieGet();
   delete obj[key];
   localStorage.setItem('cookie', JSON.stringify(obj));
}

class AjaxRequest {
   xhr: XMLHttpRequest;
   req: Promise<any>;

   constructor(xhr: XMLHttpRequest, req: Promise<any>) {
      this.xhr = xhr;
      this.req = req;
   }

   Cancel() {
      this.xhr.abort();
      // TODO: add error handler in function Ajax
      //       to make sure Promise can be handled correctly
      //       no infinite wait for (r, e)
   }

   Req() {
      return this.req;
   }
}

interface AjaxRequestOpt {
   url: string;
   method?: string;
   headers?: any;
   data?: any;
   json?: any;
   raw?: any;
   return?: any;
}

function dataToUriParam (data: any): string {
   if (!data) return '';
   const param = '?' + Object.keys(data).map((key) => {
      const val = data[key];
      return encodeURIComponent(key) + '=' + encodeURIComponent(val);
   }).join('&');
   if (param === '?') return '';
   return param;
}

export function Ajax(opt: AjaxRequestOpt): AjaxRequest {
   const xhr = new XMLHttpRequest();
   const req = new Promise((r: any, e: any) => {
      let payload: any = null;
      xhr.open(
         opt.method || 'POST',
         opt.url + dataToUriParam(opt.data),
         true
      );
      const onReadyStateChange = (evt: any) => {
         if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
            xhr.addEventListener(
               'readystatechange', onReadyStateChange
            );
            if (~~(evt.target.status / 100) === 2) {
               if (opt.return === 'json') {
                  r(JSON.parse(evt.target.response));
               } else {
                  r(evt.target.response);
               }
            } else {
               e(evt.target.status);
            }
         }
         // TODO: check error code
      };
      xhr.addEventListener(
         'readystatechange', onReadyStateChange
      );
      if (opt.headers) {
         Object.keys(opt.headers).forEach(function (key) {
            if (!opt.headers[key]) return;
            xhr.setRequestHeader(key, opt.headers[key]);
         });
      }
      if (opt.json) {
         xhr.setRequestHeader(
            "Content-Type", "application/json;charset=UTF-8"
         );
         payload = JSON.stringify(opt.json);
      } else if (opt.raw) {
         payload = opt.raw;
      }
      xhr.send(payload);
   });
   return new AjaxRequest(xhr, req);
}

const OS_WIN = ['Win32', 'Win64', 'Windows', 'WinCE'];
const OS_IOS = ['iPhone', 'iPad', 'iPod'];
const OS_MAC = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
export function GetOS(): string {
   // BlackBerry, Opera, SunOS, Linux .*, ...
   const platform = window.navigator.platform;
   if (OS_IOS.includes(platform)) return 'ios';
   if (OS_MAC.includes(platform)) return 'darwin';
   if (OS_WIN.includes(platform)) return 'windows';
   if (/Android/.test(window.navigator.userAgent)) return 'android';
   if (/Linux/.test(platform)) return 'linux';
   return 'unknown';
}
