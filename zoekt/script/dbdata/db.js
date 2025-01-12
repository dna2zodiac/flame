const i_config = require('./config');

class PostgresClient {
   constructor(config) {
     const pg = require('pg');
     this.raw = new pg.Pool({
        host: config.host || '127.0.0.1',
        user: config.user,
        password: config.pass || undefined,
        database: config.name,
        port: parseInt(config.port || '5432'),
        ssl: !!config.ssl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
     });
   }
}

function r1(result) {
  return result.rows[0];
}

function rs(result) {
  return result.rows;
}

async function atom(client, asyncFn) {
   const C = await client.connect();
   try {
      await C.query(`BEGIN`);
      await asyncFn(C);
      await C.query(`COMMIT`);
      return null;
   } catch (err) {
      await C.query(`ROLLBACK`);
      return err;
   } finally {
      C.release();
   }
}

// clause = { sql: [], vals: [] } -> sql.join(' ')
// opt = { filter: {}, order: [], offset, limit }
const validOrderRegex = /^-?[\w_.]+$/;
function add_order(clause, opt) {
   if (!opt.order || !opt.order.length) return;
   const r = [];
   // TODO: mapping and validate to avoid sql injection
   opt.order = opt.order.filter(z => validOrderRegex.test(z));
   opt.order.forEach(order => {
      if (!order) return;
      let one = order;
      if (order.startsWith('-')) {
         one = one.substring(1) + ' DESC';
      } else {
         one = one + ' ASC';
      }
      r.push(one);
   });
   clause.sql.push(`ORDER BY ${r.join(',')}`);
}

function add_page(clause, opt) {
   if (!isNaN(opt.offset)) {
      const offset = Math.max(0, parseInt(opt.offset));
      clause.sql.push(`OFFSET ${offset}`);
   }
   if (!isNaN(opt.limit)) {
      const limit = Math.max(0, Math.min(1000, parseInt(opt.limit)));
      clause.sql.push(`LIMIT ${limit}`);
   }
}

const validFieldRegex = /^[\w_.]+$/;
function add_filter(clause, opt) {
   if (!opt.filter) return;
   // & { }
   const sql = add_unit('&', opt.filter);
   if (sql) {
      if (clause.sql.includes('WHERE')) {
         clause.sql.push('AND');
      } else {
         clause.sql.push('WHERE');
      }
      clause.sql.push(sql);
   }
   function add_unit(field, obj) {
      const subsql = [];
      if (field === '&') {
         const keys = Object.keys(obj);
         if (!keys.length) return '';
         keys.forEach(key => subsql.push(add_unit(key, obj[key])));
         return `(${subsql.filter(z => !!z).join(' AND ')})`;
      } else if (field === '|') {
         const keys = Object.keys(obj);
         if (!keys.length) return '';
         keys.forEach(key => subsql.push(add_unit(key, obj[key])));
         return `(${subsql.filter(z => !!z).join(' OR ')})`;
      } else if (field === '-') {
         // "-" only has one child
         subsql.unshift('NOT');
         const keys = Object.keys(obj);
         if (!keys.length) return '';
         return `(NOT ${add_unit(keys[0], obj[keys[0]])})`;
      }
      if (!validFieldRegex.test(field)) return '';
      if (Array.isArray(obj)) {
         const op = obj[0];
         const val = obj[1];
         switch(op) {
         case '=': case '>': case '<':
         case '>=': case '<=': case 'is':
         case 'ilike': case 'like':
            clause.vals.push(val);
            return `${field} ${op} $${clause.vals.length}`;
         case 'in':
            if (!Array.isArray(val) || !val.length) return '';
            const basei = clause.vals.length + 1;
            val.forEach(v => clause.vals.push(v));
            return `${field} in (${val.map((_, i) => `$${basei + i}`)})`;
         }
         return '';
      } else {
         clause.vals.push(obj);
         return `${field} = $${clause.vals.length}`;
      }
   }
}

class SimpleCRUD {
   // cols: exclude 'id'
   constructor(tbl, cols) {
      this.tbl = tbl;
      this.cols = cols;
   }

   async get(C, ids) {
      if (!ids || !ids.length) return null;
      return rs(await C.query(`SELECT * FROM ${this.tbl} WHERE id IN (${ids.map((_, i) => `$${i+1}`).join(',')})`, ids));
   }
   async getOne(C, id) {
      if (!id) return null;
      const ret = await this.get(C, [id]);
      return ret[0];
   }

   async create(C, objs) {
      if (!objs || !objs.length) return null;
      let ii = 0;
      const k = [], v = [];
      objs.forEach(obj => {
         k.push(`(${this.cols.map((z, i) => {
            if (obj[z] === undefined) v.push(null); else v.push(obj[z]);
            ii++;
            return `$${ii+i}`;
         }).join(',')})`);
      });
      const ret = rs(await C.query(`INSERT INTO ${this.tbl} (${this.cols.join(',')}) VALUES ${k.join(',')} RETURNING id`, v));
      return ret.map(z => z.id);
   }
   async createOne(C, obj) {
      const ret = await this.create(C, [obj]);
      return ret[0];
   }

   async update(C, id, obj) {
      if (!id) return;
      let ii = 2;
      const k = [], v = [];
      this.cols.forEach(z => {
         if (obj[z] === undefined) return;
         k.push(`${z} = $${ii}`);
         v.push(obj[z]);
         ii++;
      });
      if (!k.length) return;
      v.unshift(id);
      await C.query(`UPDATE ${this.tbl} SET ${k.join(',')} WHERE id = $1`, v);
   }

   async remove(C, ids) {
      if (!ids || !ids.length) return;
      await C.query(`DELETE FROM ${this.tbl} WHERE id IN (${ids.map((_, i) => `$${i+1}`).join(',')})`, ids);
   }
   async removeOne(C, id) {
      if (!id) return;
      await this.remove(C, [id]);
   }
}


const clients = {
   seven: new PostgresClient({
      host: i_config.DB_HOST,
      port: i_config.DB_PORT,
      user: i_config.DB_USER,
      pass: i_config.DB_PASS,
      name: i_config.DB_NAME,
      ssl: i_config.DB_SSL,
   }),
};

module.exports = {
   seven: clients.seven,
   util: {
      r1, rs, atom,
      add_order,
      add_page,
      add_filter,
   },
   SimpleCRUD,
   PostgresClient,
};
