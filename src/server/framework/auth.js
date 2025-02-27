const i_fs = require('fs');
const i_path = require('path');
const i_crypto = require('crypto');

const i_util = require('./util');

const AUTH_BASE_DIR = (
   process.env.FLAME_AUTH_BASE_DIR?
   i_path.resolve(process.env.FLAME_AUTH_BASE_DIR):null
);
const AUTH_SESSION_TIMEOUT = parseInt(
   process.env.FLAME_ATUH_TIMEOUT || `${24 * 3600}`
) * 1000 || Infinity;
if (!AUTH_BASE_DIR) {
   console.warn('[!] FLAME_AUTH_BASE_DIR is empty: authentication module not work');
}

const sessionCache = {};

function validateUsername(username) {
   if (!username) return false;
   if (/[~!@#$%^&*+=\[\]|\\:?]/.test(username)) return false;
   if (username.indexOf('..') >= 0) return false;
   return true;
}

const api = {
   checkUserPassword: async (username, password) => {
      if (!AUTH_BASE_DIR) return false;
      if (!username || !password) return false;
      if (!validateUsername(username)) return false;
      const authfile = i_path.join(AUTH_BASE_DIR, username);
      if (!(await i_util.fileOp.exist(authfile))) return false;
      const contents = (await i_util.fileOp.read(authfile)).toString().trim();
      return contents === password;
   }, // checkUserPassword
   checkUserSession: async (username, sessionId) => {
      if (!AUTH_BASE_DIR) return null;
      if (!username || !sessionId) return null;
      if (!validateUsername(username)) return null;

      const cache = sessionCache[username];
      if (cache) {
         if (sessionId !== cache.uuid) return null;
         const expect = await api.getUserSession(username);
         if (expect !== sessionId) {
            cache.uuid = expect;
            cache.mtime = new Date().getTime();
         }
         return expect;
      }

      const basedir = i_path.join(AUTH_BASE_DIR, '..session');
      const sessfile = i_path.join(basedir, username);
      try {
         const obj = JSON.parse(await i_util.fileOp.read(sessfile));
         if (sessionId !== obj.uuid) return null;
         const expect = await api.getUserSession(username);
         return expect;
      } catch (err) {
         return null;
      }
   }, // checkUserSession
   getUserSession: async (username) => {
      if (!AUTH_BASE_DIR) return null;
      if (!validateUsername(username)) return null;
      let sessionId = '';

      const cache = sessionCache[username];
      if (cache) {
         if (new Date().getTime() - cache.mtime <= AUTH_SESSION_TIMEOUT) {
            sessionId = cache.uuid;
            return sessionId;
         }
      }

      const basedir = i_path.join(AUTH_BASE_DIR, '..session');
      const sessfile = i_path.join(basedir, username);
      if (!(await i_util.fileOp.exist(basedir))) await i_util.fileOp.mkdir(basedir);
      try {
         const obj = JSON.parse(await i_util.fileOp.read(sessfile));
         sessionCache[username] = { mtime: obj.mtime, uuid: obj.uuid };
         if (new Date().getTime() - obj.mtime <= AUTH_SESSION_TIMEOUT) {
            sessionId = obj.uuid;
         }
      } catch (err) {
         sessionId = '';
      }
      if (!sessionId) {
         sessionId = i_crypto.randomUUID();
         const obj = { mtime: new Date().getTime(), uuid: sessionId };
         sessionCache[username] = obj;
         await i_util.fileOp.write(
            sessfile,
            Buffer.from(JSON.stringify(obj))
         );
      }
      return sessionId;
   }, // getuserSession
   removeUserSession: async (username) => {
      if (!AUTH_BASE_DIR) return false;
      if (!validateUsername(username)) return false;
      const basedir = i_path.join(AUTH_BASE_DIR, '..session');
      const sessfile = i_path.join(basedir, username);
      if (!(await i_util.fileOp.exist(sessfile))) return false;
      await i_util.fileOp.unlink(sessfile);
      return true;
   }, // removeUserSession
   requireLogin: (fn) => {
      return async (req, res, opt) => {
         const auth = req.headers['auth_token'];
         if (!auth) return i_util.e401(res);
         const parts = auth.split(':');
         const obj = { user: parts[0], uuid: parts[1] };
         if (!obj.user || !obj.uuid) return i_util.e401(res);
         const updatedSessionId = await api.checkUserSession(obj.user, obj.uuid);
         if (!updatedSessionId) return i_util.e401(res);
         opt.json = obj;
         opt.nextSessionId = updatedSessionId;
         if (fn) fn(req, res, opt);
      };
   },
   initializeJsonOutput: (opt) => {
      // determine if need to update access token (uuid) at client side
      const obj = {};
      if (!opt || !opt.json) return obj;
      if (opt.nextSessionId === opt.json.uuid) return obj;
      obj.sessionId = opt.nextSessionId;
      return obj;
   }, // initializeJsonOutput
};
const restful = {
   // { user: <username>, uuid: <sessionId> }
   login: async (req, res, opt) => {
      const obj = await i_util.readRequestJson(req);
      if (!obj || !obj.username || !obj.password) {
         return i_util.e400(res);
      }
      if (!(await api.checkUserPassword(obj.username, obj.password))) {
         return i_util.e401(res);
      }
      try {
         const sessionId = await api.getUserSession(obj.username);
         i_util.rJson(res, { sessionId });
      } catch (err) {
         console.error('auth.login', err);
         i_util.e500(res);
      }
   }, // login
   logout: api.requireLogin(async (req, res, opt) => {
      try {
         await api.removeUserSession(opt.json.user);
         i_util.rJson(res, { ok: 1 });
      } catch (err) {
         console.error(err);
         i_util.e500(res);
      }
   }), // logout
   echotest: api.requireLogin(async (req, res, opt) => {
      const out = api.initializeJsonOutput(opt);
      out.path = opt.path.join('/');
      i_util.rJson(res, out);
   }), // echotest
}

api.webRestful = restful;
module.exports = api;
