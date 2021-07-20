import {SetTheme} from './style/style';
import {AppFrame} from './component/app';

class FlameApp {
   constructor() {
      SetTheme('light');
      new AppFrame();
   }
}

new FlameApp();
