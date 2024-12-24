const {SetTheme} = require('./style/style');
const {AppFrame} = require('./component/app');
const {CookieGet} = require('./logic/util');

class FlameApp {
   constructor() {
      const cookie = CookieGet();
      SetTheme(cookie.theme || 'light');
      new AppFrame();
   }
}

new FlameApp();
