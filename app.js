const fs = require('fs');
const path = require('path');
const express = require('express');
//const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const authRouter = require('./src/routes/auth');
const authCheck = require('./src/utils/authCheck.js');
const articlesRouter = require('./src/routes/articles');
const commentsRouter = require('./src/routes/comments');
var IpCheck = require('./src/utils/IpCheck.js');
var exception = require('./src/utils/exception.js');

const app = express();
const port = 3000;

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
app.use((req, res, next) => {
    req.session.clientIP = req.ip; // 클라이언트의 IP 주소 저장
    next();
});

//app.use(helmet());
app.use('/uploads', express.static(__dirname + '/uploads'));


// Routers
app.use('/auth', authRouter);
app.use('/articles', articlesRouter);
app.use('/comments', commentsRouter);
app.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.redirect('/auth/login');
        return false;
    } else if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return false;
    } else {
        res.redirect('/main');
        return false;
    }
})
app.get('/main', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.redirect('/auth/login');
        return false;
    } else if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return false;
    }
    const filePath = path.join(__dirname, './src/templates/main.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
})

// listen carefully
app.listen(port, () => {
    console.log(`Node.js app listening on port ${port}`)
})