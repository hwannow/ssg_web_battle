const mysql = require('mysql2');
const fs = require("fs");

require('dotenv').config();

const connection = mysql.createPool({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_DATABASE_NAME,
  enableKeepAlive: true,
  multipleStatements: true
});

connection.getConnection((error) => {
  if (error) {
    console.error('Failed to connect to MySQL:', error);
    return;
  }
  console.log('Successfully connected to MySQL!');

  fs.readFile('./setting.sql', 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading file:', readErr);
      connection.end();
      return;
    }
    
    // 읽은 SQL 파일 실행
    connection.query(data, (queryErr, results) => {
      if (queryErr) {
        console.error('Error executing query:', queryErr);
        connection.end();
        return;
      }
      console.log('Successfully create tables');
    });
  });

}
);

module.exports = connection;
