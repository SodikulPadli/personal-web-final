// import postgres poll

const { Pool } = require('pg');

// setup connection pool

const dbPool = new Pool({
  database: 'personal_web',
  port: 5432,
  user: 'postgres',
  password: 'root',
});

// export dbPoll
module.exports = dbPool;
