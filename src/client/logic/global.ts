import {TaskRunner} from './task';

export const Env: any = {
   task: new TaskRunner(),
   mask: {
      show: (zIndex: number = 0) => {
         let div = document.querySelector('.mask');
         if (!div) {
            div = document.createElement('div');
            div.className = 'mask';
            document.body.appendChild(div);
         }
         div.style.display = 'block';
         if (zIndex) {
            div.style.zIndex = zIndex;
         }
      },
      hide: () => {
         const div = document.querySelector('.mask');
         if (!div) return;
         div.style.display = 'none';
      }
   }
};
