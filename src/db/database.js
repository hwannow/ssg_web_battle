const mysql = require('mysql2');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'web'
});

connection.connect((error) => {
  if (error) {
    console.error('Failed to connect to MySQL:', error);
    return;
  }
  console.log('Connected to MySQL!');
});


module.exports = connection;