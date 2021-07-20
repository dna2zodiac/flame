import {SetTheme} from './style/style';
import {AppFrame} from './layout/app';

class FlameApp {
   constructor() {
      SetTheme('light');
      new AppFrame();
   }
}

new FlameApp();
