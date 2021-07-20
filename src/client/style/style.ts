import * as light from './light';
import * as dark from './dark';

const STYLE = document.createElement('style');

export function SetTheme(theme: string) {
   switch (theme) {
   case 'dark':
      STYLE.innerHTML = <string>dark.style;
      break;
   case 'light':
   default:
      STYLE.innerHTML = light.style;
   }
   if (!STYLE.parentNode) {
      document.head.appendChild(STYLE);
   }
}
