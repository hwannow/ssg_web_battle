const fs = require('fs');
const path = require('path');
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)

var authRouter = require('./src/routes/auth');
var authCheck = require('./src/utils/authCheck.js');

var articlesRouter = require('./src/routes/articles');
var commentsRouter = require('./src/routes/comments');

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  store:new FileStore(),
}))

app.use('/uploads', express.static(__dirname + '/uploads'));

app.get('/', (req, res) => {
  if (!authCheck.isOwner(req, res)) {
    res.redirect('/auth/login');
    return false;
  } else {
    res.redirect('/main');
    return false;
  }
})

// Routers
app.use('/auth', authRouter);
app.use('/articles', articlesRouter);
app.use('/comments', commentsRouter);


app.get('/main', (req, res) => {
  if (!authCheck.isOwner(req, res)) {
    res.redirect('/auth/login');
    return false;
  }
  const filePath = path.join(__dirname, './template/main.html');
  fs.readFile(filePath, 'utf8', function (err, html) {
      res.send(html);
  });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})