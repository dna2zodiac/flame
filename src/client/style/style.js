const common = require('./common');
const light = require('./light');
const dark = require('./dark');

const STYLE = document.createElement('style');

function mergeStyleObjects(styleA, styleB) {
   const obj = Object.assign({}, styleA);
   Object.keys(styleB).forEach((selector) => {
      obj[selector] = Object.assign(
         obj[selector] || {}, styleB[selector]
      );
   });
   return obj;
}

function compileStyleObjects(style) {
   return Object.keys(style).map((selector) => {
      const keyval = style[selector];
      if (!keyval) return '';
      const content = Object.keys(keyval).map(
         (key) => {
            const val = keyval[key];
            if (val.startsWith('{')) return `${key}${val}`;
            return `${key}:${val};`;
         }
      ).join('');
      return `${selector}{${content}}`;
   }).filter(x => !!x).join(' ');
}

function SetTheme(theme) {
   switch (theme) {
   case 'dark':
      STYLE.innerHTML = compileStyleObjects(
         mergeStyleObjects(common.styleObjects, dark.styleObjects)
      );
      break;
   case 'light':
   default:
      STYLE.innerHTML = compileStyleObjects(
         mergeStyleObjects(common.styleObjects, light.styleObjects)
      );
   }
   if (!STYLE.parentNode) {
      document.head.appendChild(STYLE);
   }
}

function StyleMap() {
   this.self = document.createElement('style');
}
StyleMap.prototype = {
   GetDom: function() {
      return this.self;
   },
   Compile: function(style) {
      this.self.innerHTML = compileStyleObjects(style);
   },
};

module.exports = {
   StyleMap,
   SetTheme,
};
