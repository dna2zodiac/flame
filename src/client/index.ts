import {SetTheme} from './style/style';
import {AppFrame} from './component/app';
import {CookieGet} from './logic/util';

class FlameApp {
   constructor() {
      const cookie = CookieGet();
      SetTheme(cookie.theme || 'light');
      new AppFrame();
   }
}

new FlameApp();
