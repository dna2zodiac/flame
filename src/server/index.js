const i_content = require('./api/content');
const i_server = require('./framework/server.js');

const api = {
   content: i_content.api
};
i_server.Start(api);
