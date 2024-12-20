export const styleObjects = {
   'body': { margin: '0' },
   '.title': {
      'margin-left': '3px',
      'font-size': '16px',
      'font-weight': '400',
      'font-family': 'Metropolis,"Avenir Next","Helvetica Neue",Arial,sans-serif',
      color: '#fafafa',
      'text-decoration': 'none',
   },
   '.header-icon': {
      height: '36px',
      width: '36px',
      'vertical-align': 'middle',
      'margin-top': '-10px',
   },
   '.branding': { 'padding-top': '18px' },
   '.header': {
      color: '#fafafa',
      'padding-left': '24px',
      height: '60px',
      'background-color': '#e4a961',
      'white-space': 'nowrap',
   },
   '.mask': {
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: '0',
      left: '0',
      'background-color': 'white',
      opacity: '0.3',
      'z-index': '9000',
   },
   '.item': {
      display: 'block',
      'margin-top': '2px',
      padding: '10px 0px 10px 10px',
      'text-decoration': 'none',
      color: 'black',
   },
   '.item-r': {
      display: 'block',
      'margin-top': '2px',
      'margin-left': '-10px',
      padding: '10px 10px 10px 0',
      'text-decoration': 'none',
      'text-align': 'right',
      color: 'black',
   },
   '.item-thin': {
      display: 'block',
      margin: '1px 1px',
      padding: '1px 1px',
      'text-decoration': 'none',
      color: 'black',
   },
   '.item-container': {
      display: 'block',
      'padding-left': '2px',
      'margin-left': '6px',
      'white-space': 'nowrap',
   },
   '.item-btn': {
      display: 'inline-block',
      padding: '5px',
      'border-radius': '3px',
      cursor: 'pointer',
      border: '1px solid black',
   },
   '.item.btn': { cursor: 'pointer' },
   '.item-r.btn': { cursor: 'pointer' },
   '.item-thin.btn': { cursor: 'pointer' },
   '.item-badge': {
      border: '1px solid black',
      padding: '0 5px 0 5px',
      'margin-left': '10px',
      cursor: 'pointer',
   },
   '.item-input': {
      padding: '5px',
      'border-top': '0',
      'border-left': '0',
      'border-right': '0',
      'border-bottom': '1px solid black'
   },
   'a.item-r:hover': {
      opacity: '0.5',
      cursor: 'pointer',
      'text-decoration': 'none',
      color: 'black',
   },
   'a.item:hover': {
      opacity: '0.5',
      cursor: 'pointer',
      'text-decoration': 'none',
      color: 'black',
   },
   '.item-btn:hover': {
      border: '1px solid black',
      color: 'white',
      cursor: 'pointer',
      'text-decoration': 'none',
   },
   '.item-grey':   { 'background-color': '#e2e2e2' },
   '.item-red':    { 'background-color': '#f5cdcd' },
   '.item-green':  { 'background-color': '#cff5cd' },
   '.item-blue':   { 'background-color': '#cdebf5' },
   '.item-yellow': { 'background-color': '#fbf59f' },
   '.item-orange': { 'background-color': '#ffe6cc' },
   '.item-pink':   { 'background-color': '#f5cde8' },
   '.item-purple': { 'background-color': '#dfcdf5' },
   '.item-gray-1': { 'background-color': '#ddd' },
   '.item-gray-2': { 'background-color': '#aaa' },
   '.item-gray-3': { 'background-color': '#777' },
   '.item-invert': { filter: 'invert(100%)' },
   '.flex-table': {
      width: '100%',
      display: 'flex'
   },
   '.flex-list': {
      height: '100%',
      display: 'flex'
   },
   '.flex-frame': {
      width: '100%',
      height: '100%',
      display: 'flex'
   },
   '.flex-column': { 'flex-direction': 'column' },
   '.flex-row': { 'flex-direction': 'row' },
   '.flex10-auto': { 'flex': '1 0 auto' },
   '.flex11-auto': { 'flex': '1 1 auto' },
   '.flex-w0': { width: '0px' },
   '.flex-h0': { height: '0px' },
   '@keyframes spin-spinner': { 'to': '{ transform: rotate(360deg); }' },
   '.spin::before': {
      display: 'inline-block',
      animation: 'spin-spinner 1s ease-in-out infinite',
      'animation-play-state': 'inherit',
      border: 'solid 3px #cfd0d1',
      'border-top-color': '#1c87c9',
      'border-radius': '50%',
      content: '""',
   },
   '.spin-sm::before': { width: '8px', height: '8px' },
   '.full': {
      width: '100%',
      height: '100%',
   },
   '.full-w': { width: '100%' },
   '.full-h': { height: '100%' },
   '.fixed': { overflow: 'hidden' },
   '.scrollable': { overflow: 'auto' },
   '.scrollable-x': {
      'overflow-x': 'auto',
      'overflow-y': 'hidden',
   },
   '.scrollable-y': {
      'overflow-x': 'hidden',
      'overflow-y': 'auto',
   },
   '.scrollable-no': { overflow: 'hidden' },
   '.app-icon-nav': {
      'border-right': '1px solid #ccc',
   },
   '.nav-icon-btn': {
      cursor: 'pointer',
      padding: '5px 8px 5px 8px',
      'margin-top': '5px',
      'border-left': 'none',
      'border-top': 'none',
      'border-bottom': 'none',
      'border-right': '3px solid white',
      'background-color': 'white',
   },
   '.nav-icon-btn:hover': {
      'border-right': '3px solid #ccc',
      'background-color': '#eee',
   },
   '.nav-icon-btn.active': {
      'border-right': '3px solid black',
   },
   '.nav-icon-btn > img': {
      width: '24px',
      height: '24px',
   },
   '.breadcrumb-a': {
      color: 'black'
   },
   '.side-container': {
      // it is important for making side view
      // out of flex box when screen is small
      'background-color': 'white'
   },
   '.editor-container': {
      width: '100%',
      height: '100%',
      overflow: 'auto',
   },
   '.editor-side-flex': {
      display: 'flex',
      'flex-direction': 'row',
   },
   '.editor-left-side': {
      'margin-right': '2px',
      'padding-right': '2px',
      'border-right': '1px solid #999',
      'text-align': 'right',
      float: 'left',
      position: 'sticky',
      left: '0px',
      'background-color': 'white',
   },
   '.editor-linenumber': {
      'margin-left': '5px',
      'user-select': 'none',
   },
   '.editor-linenumber > a': {
      cursor: 'pointer',
      display: 'inline-block',
      width: '100%',
   },
   '.editor-linenumber > a.active': {
      'border-right': '3px solid blue',
      'padding-right': '1px',
      'background-color': '#ccf',
   },
   '.editor-text': {
      border: 'none',
      padding: '0px',
      margin: '0px',
      'tab-size': '4',
      /* XXX: Mozilla FireFox for Ubuntu 90.0 (64bit)
              "-moz-tab-size: 4" does not work?
              it works the same as "-moz-tab-size: 1".
              wtf! use 3 temporarily. */
      '-moz-tab-size': '3',
   },
   '.editor-font': {
      'font-family': 'monospace',
      'font-size': '14px',
   },
   '.editor-highlight': {
      position: 'relative',
      width: '0px',
      height: '0px',
      'z-index': '-10',
   },
   '.editor-highlight > div': {
      position: 'absolute'
   },
   '.editor-highlight > div.line': {
      'background-color': '#ff7'
   },
   '.folder-fold-btn': {
      background: 'url(\'img/angle.svg\')',
      width: '12px',
      height: '12px',
      'text-decoration': 'none',
      display: 'inline-block',
      margin: '1px',
      padding: '1px',
      cursor: 'pointer',
   },
   '.folder-fold-btn.active': {
      transform: 'rotate(180deg)',
   },
   '.search-item a': {
      'text-decoration': 'none',
      color: 'black',
      display: 'block'
   },
};
