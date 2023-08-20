const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const db = require('../utils/database');
const exception = require('../utils/exception.js');
const filter = require('../utils/filter.js');

// 로그인 화면
router.get('/login', function (req, res) {
    const filePath = path.join(__dirname, '../templates/login.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
});

// 로그인 프로세스
router.post('/login_process', function (req, res) {
    let {username, pwd} = req.body;

    if (!username || !pwd) {
        res.send(exception.alertWindow("아이디와 비밀번호를 입력하세요!", "/auth/login"));   
        return;
    }

    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, pwd], function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0 && results[0].password === pwd) {       // db에서의 반환값이 있으면 로그인 성공
            req.session.is_logined = true;      // 세션 정보 갱신
            req.session.nickname = username;
            req.session.usersId = results[0].id;
            req.session.save(function () {
                res.redirect(`/`);
            });
        } else {              
            res.send(exception.alertWindow("로그인 정보가 일치하지 않습니다.", "/auth/login"));    
        }            
    });
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
    let {username, pwd, pwd2} = req.body;

    if (!username || !pwd || !pwd2) {
        res.send(exception.alertWindow("입력되지 않은 정보가 있습니다.", "/auth/signup"));
        return;
    } else if (username.length < 8 || pwd.length < 8) {
        res.send(exception.alertWindow("아이디와 패스워드는 8자 이상 입력해 주세요!", "/auth/signup"));
        return;
    } else if (username.length > 50 || pwd.length > 255) {
        res.send(exception.alertWindow("아이디는 50자, 패스워드는 255자까지 입력 가능합니다!", "/auth/signup"));
        return;
    }

    if (filter.filtering(username) || filter.filtering(pwd)) {
        res.send(exception.alertWindow("적절하지 않은 문자가 있습니다.", "/auth/signup"));
        return false;
    }
    db.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
        if (error) throw error;
        if (results.length <= 0 && pwd === pwd2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
            db.query('INSERT INTO users (username, password) VALUES(?,?)', [username, pwd], function (error, data) {
                if (error) throw error;
                res.send(exception.alertWindow("회원가입이 완료되었습니다!", "/"));
            });
        } else if (pwd != pwd2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(exception.alertWindow("입력된 비밀번호가 서로 다릅니다.", "/auth/signup"));    
        } else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(exception.alertWindow("이미 존재하는 아이디 입니다.", "/auth/signup"));    
        }
    });
});

module.exports = router;
