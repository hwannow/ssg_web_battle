const fs = require('fs');
const path = require('path');
var express = require('express');
var router = express.Router();

var db = require('../utils/database');

// 로그인 화면
router.get('/login', function (req, res) {
    const filePath = path.join(__dirname, '../templates/login.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
});

// 로그인 프로세스
router.post('/login_process', function (req, res) {
    var username = req.body.username;
    var password = req.body.pwd;
    if (username && password) {
        db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 로그인 성공
                req.session.is_logined = true;      // 세션 정보 갱신
                req.session.nickname = username;
                req.session.usersId = results[0].id;
                req.session.save(function () {
                    res.redirect(`/`);
                });
            } else {              
                res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/login";</script>`);    
            }            
        });

    } else {
        res.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="/auth/login";</script>`);    
    }
});

// 로그아웃
router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});


// 회원가입 화면
router.get('/signup', function(req, res) {
    const filePath = path.join(__dirname, '../templates/form.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
});
 
// 회원가입 프로세스
router.post('/register_process', function(req, res) {    
    var username = req.body.username;
    var password = req.body.pwd;    
    var password2 = req.body.pwd2;

    if (username && password && password2) {
        if (username.length < 8 || password.length < 8) {
            res.send(`<script type="text/javascript">alert("아이디와 패스워드는 8자 이상 입력해 주세요!"); 
            document.location.href="/auth/signup";</script>`);
            return;
        } else if (username.length > 50 || password.length > 255) {
            res.send(`<script type="text/javascript">alert("아이디는 50자, 패스워드는 255자까지 입력 가능합니다!"); 
            document.location.href="/auth/signup";</script>`);
            return;
        }
        db.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
        if (error) throw error;
        if (results.length <= 0 && password === password2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
            db.query('INSERT INTO users (username, password) VALUES(?,?)', [username, password], function (error, data) {
                if (error) throw error;
                res.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다!");
                document.location.href="/";</script>`);
            });
        } else if (password != password2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
            document.location.href="/auth/signup";</script>`);    
        }
        else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
            document.location.href="/auth/signup";</script>`);    
        }});
    } 
    else {        // 입력되지 않은 정보가 있는 경우
        res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/signup";</script>`);
    }
});

module.exports = router;
