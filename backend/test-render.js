const { Client } = require('pg');
const cs = process.env.DATABASE_URL || 'postgresql://yepyep_user:DjIxbuHvknTYTROQWGdJm6uPmob46Oay@dpg-d58tsger433s73fg9360-a.virginia-postgres.render.com/yepyep';
const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query('SELECT NOW()'))
  .then(res => { console.log('OK', res.rows); client.end(); })
  .catch(err => { console.error('ERROR', err); client.end().catch(()=>{}); process.exit(1); });
