const fs = require('fs');
//const helmet = require('helmet');
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
    cookie: {	//세션 쿠키 설정 (세션 관리 시 클라이언트에 보내는 쿠키)
        httpOnly: true, // 자바스크립트를 통해 세션 쿠키를 사용할 수 없도록 함
        Secure: true
    },
    secure: true,
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
}))

//app.use(helmet());
app.use('/uploads', express.static(__dirname + '/uploads'));

app.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
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
    if (!authCheck.isLogined(req, res)) {
        res.redirect('/auth/login');
        return false;
    }
    const filePath = path.join(__dirname, './src/templates/main.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
})

app.listen(port, () => {
    console.log(`Node.js app listening on port ${port}`)
})