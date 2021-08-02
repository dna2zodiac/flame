import * as common from './common';
import * as light from './light';
import * as dark from './dark';

const STYLE = document.createElement('style');

function mergeStyleObjects(styleA: any, styleB: any): any {
   const obj = Object.assign({}, styleA);
   Object.keys(styleB).forEach((selector: string) => {
      obj[selector] = Object.assign(
         obj[selector] || {}, styleB[selector]
      );
   });
   return obj;
}

function compileStyleObjects(style: any): string {
   return Object.keys(style).map((selector: string) => {
      const keyval: any = style[selector];
      if (!keyval) return '';
      const content: string = Object.keys(keyval).map(
         (key: string) => {
            const val: string = keyval[key];
            if (val.startsWith('{')) return `${key}${val}`;
            return `${key}:${val};`;
         }
      ).join('');
      return `${selector}{${content}}`;
   }).filter((x: string) => !!x).join(' ');
}

export function SetTheme(theme: string) {
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
