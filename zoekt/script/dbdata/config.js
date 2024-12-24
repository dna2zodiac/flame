const i_path = require('path');
const i_dotenv = require('dotenv');
i_dotenv.config({ path: i_path.join(__dirname, `.env`) });

module.exports = {
   DB_TYPE: process.env.DB_TYPE,
   DB_HOST: process.env.DB_HOST,
   DB_PORT: process.env.DB_PORT,
   DB_USER: process.env.DB_USER,
   DB_PASS: process.env.DB_PASS,
   DB_SSL: !!process.env.DB_SSL,
};
