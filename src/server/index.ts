import * as content from './api/content';

const i_server = require('./framework/server.js');

const api = {
   content: content.api
};
i_server.Start(api);
