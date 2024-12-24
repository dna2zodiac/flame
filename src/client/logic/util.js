function Elem (tag) {
   return document.createElement(tag);
}

function ElemAppend(elem, ch) {
   elem.appendChild(ch);
}

function ElemEmpty (elem) {
   while(elem.children.length) elem.removeChild(elem.children[0]);
   elem.innerHTML = '';
   return elem;
}

function ElemAppendText(elem, text) {
   elem.appendChild(document.createTextNode(text));
   return elem;
}

function ElemAppendHtml(elem, html) {
   elem.innerHTML += html;
   return elem;
}

function HtmlEncode(text) {
   text = text.replace(/&/g, '&amp;');
   text = text.replace(/</g, '&lt;');
   text = text.replace(/>/g, '&gt;');
   return text;
}

function ElemSafeAppendHtml(elem, html) {
   // XXX: const fg = document.createDocumentFragment();
   const fg = document.createElement('div');
   fg.innerHTML = html;
   if (!guard(fg)) {
      return false;
   }
   elem.innerHTML += html;
   return true;

   function guard(elem) {
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

function ElemDivMessage(elem, message, color, icon) {
   const div = document.createElement('div');
   if (icon) {
      div.appendChild(ElemIcon(icon, 14, 14));
   }
   ElemAppendText(div, message);
   ElemEmpty(elem);
   div.className = 'item item-' + (color || 'blue');
   elem.appendChild(div);
}

function ElemFlash(elem, count) {
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

function ElemIcon(src, w, h) {
   const img = document.createElement('img');
   img.src = src;
   img.style.width = `${w}px`;
   img.style.height = `${h}px`;
   return img;
}

function PageLoading(zIndex) {
   let div = document.querySelector('.mask');
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

function PageLoaded() {
   const div = document.querySelector('.mask');
   if (!div) return;
   div.style.display = 'none';
}

function UuidUpdate(jsonData) {
   const obj = jsonData?JSON.parse(jsonData):{};
   if (obj.sessionId) CookieSet('uuid', obj.sessionId);
}

function IsMobileBrowser() {
   const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
   if (/android|iphone|ipod|kindle/.test(userAgent)) return true;
   return false;
}

function TriggerDownload(url, name) {
   const link = document.createElement("a");
   link.download = name;
   link.href = url;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

function TriggerDownloadWithFetch(url, name) {
   window.fetch(url).then((res) => {
      res.blob().then((blob) => {
         const url = window.URL.createObjectURL(blob);
         TriggerDownload(url, name);
         window.URL.revokeObjectURL(url);
      });
   });
}

function CopyToClipboard(text) {
   const textArea = document.createElement('textarea');
   textArea.style.position = 'fixed';
   textArea.style.top = '0px';
   textArea.style.left = '0px';
   textArea.value = text;
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   try { document.execCommand('copy'); } catch (err) {}
   document.body.removeChild(textArea);
}

function CookieGet() {
   try {
      return JSON.parse(localStorage.getItem('cookie') || '{}');
   } catch (err) {
      return {};
   }
}

function CookieSet(key, value) {
   const obj = CookieGet();
   obj[key] = value;
   localStorage.setItem('cookie', JSON.stringify(obj));
}

function CookieErase(key) {
   if (!key) {
      localStorage.removeItem('cookie');
      return;
   }
   var obj = CookieGet();
   delete obj[key];
   localStorage.setItem('cookie', JSON.stringify(obj));
}

function AjaxRequest(xhr, req) {
   this.xhr = xhr;
   this.req = req;
}
AjaxRequest.prototype = {
   Cancel: function() {
      this.xhr.abort();
      // TODO: add error handler in function Ajax
      //       to make sure Promise can be handled correctly
      //       no infinite wait for (r, e)
   },
   Req: function() {
      return this.req;
   },
};

function dataToUriParam (data) {
   if (!data) return '';
   const param = '?' + Object.keys(data).map((key) => {
      const val = data[key];
      return encodeURIComponent(key) + '=' + encodeURIComponent(val);
   }).join('&');
   if (param === '?') return '';
   return param;
}

function Ajax(opt) {
   const xhr = new XMLHttpRequest();
   const req = new Promise((r, e) => {
      let payload = null;
      xhr.open(
         opt.method || 'POST',
         opt.url + dataToUriParam(opt.data),
         true
      );
      const onReadyStateChange = (evt) => {
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
function GetOS() {
   // BlackBerry, Opera, SunOS, Linux .*, ...
   const platform = window.navigator.platform;
   if (OS_IOS.includes(platform)) return 'ios';
   if (OS_MAC.includes(platform)) return 'darwin';
   if (OS_WIN.includes(platform)) return 'windows';
   if (/Android/.test(window.navigator.userAgent)) return 'android';
   if (/Linux/.test(platform)) return 'linux';
   return 'unknown';
}

module.exports = {
   Elem,
   ElemAppend,
   ElemEmpty,
   ElemAppendText,
   ElemAppendHtml,
   HtmlEncode,
   ElemSafeAppendHtml,
   ElemDivMessage,
   ElemFlash,
   ElemIcon,
   PageLoading,
   PageLoaded,
   UuidUpdate,
   IsMobileBrowser,
   TriggerDownload,
   TriggerDownloadWithFetch,
   CopyToClipboard,
   CookieGet,
   CookieSet,
   CookieErase,
   Ajax,
   GetOS,
};
