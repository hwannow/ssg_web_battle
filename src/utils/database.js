const mysql = require('mysql2');
require('dotenv').config();
const connection = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_DATABASE_NAME
});

connection.connect((error) => {
  if (error) {
    console.error('Failed to connect to MySQL:', error);
    return;
  }
  console.log('Connected to MySQL!');
});

module.exports = connection;