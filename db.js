
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5433),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});

module.exports = pool;
