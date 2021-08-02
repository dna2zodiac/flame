// dark theme
// TODO: button(element icon) -> ?invert; e.g. search btn
export const styleObjects = {
   body: {
      'background-color': 'black'
   },
   '.title': {
      color: '#060606'
   },
   '.header': {
      color: '#060606',
      'background-color': '#805e35'
   },
   '.item': { color: '#ccc' },
   '.item-r': { color: '#ccc' },
   '.item-thin': { color: '#ccc' },
   '.item-btn': { border: '1px solid #ccc' },
   '.item-input': {
      'border-bottom': '1px solid #777',
      color: '#ccc',
      'background-color': 'black'
   },
   'a.item-r:hover': { color: '#ccc' },
   'a.item:hover': { color: '#ccc' },
   '.item-btn:hover': { border: '1px solid #ccc', color: '#666' },
   '.item-grey':   { 'background-color': '#262626' },
   '.item-red':    { 'background-color': '#735353' },
   '.item-green':  { 'background-color': '#465b45' },
   '.item-blue':   { 'background-color': '#4d6066' },
   '.item-yellow': { 'background-color': '#625f37' },
   '.item-orange': { 'background-color': '#847463' },
   '.item-pink':   { 'background-color': '#977c8f' },
   '.item-purple': { 'background-color': '#492459' },
   '.item-gray-1': { 'background-color': '#333' },
   '.item-gray-2': { 'background-color': '#777' },
   '.item-gray-3': { 'background-color': '#999' },
   '.spin::before': {
      'border-top-color': '#1c87c9',
      'border-radius': '50%'
   },
   '.app-icon-nav': {
      'background-color': 'black'
   },
   '.nav-icon-btn': {
      'border-right': '3px solid white',
      filter: 'invert(100%)'
   },
   '.nav-icon-btn:hover': {
      'border-right': '3px solid #ccc',
      'background-color': '#eee',
      filter: 'invert(100%)'
   },
   '.nav-icon-btn.active': {
      'border-right': '3px solid black',
      filter: 'invert(100%)'
   },
   '.breadcrumb-a': {
      color: 'white'
   },
   '.side-container': {
      'background-color': 'black'
   },
   '.editor-left-side': {
      color: '#ccc',
      'background-color': 'black'
   },
   '.editor-text': {
      color: '#ccc',
      'background-color': 'black'
   },
   '.editor-linenumber > a.active': {
      'border-right': '3px solid blue',
      'backround-color': '#484860'
   },
   '.folder-fold-btn': {
      filter: 'invert(100%)'
   }
};
