const fs = require('fs');
const crypto = require('crypto');
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
    let hashAlgorithm = crypto.createHash('sha512');
    let hashing = hashAlgorithm.update(pwd);
    let hashedPwd = hashing.digest('base64');
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPwd], function(error, results, fields) {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
            return;
        }
        if (results.length > 0 && results[0].password === hashedPwd) {       // db에서의 반환값이 있으면 로그인 성공
            req.session.is_logined = true;      // 세션 정보 갱신
            req.session.nickname = username;
            req.session.usersId = results[0].id;
            req.session.clientIP = req.ip;
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
    console.log("요청 들어옴");
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
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
    let {username, pwd, pwd2, ques} = req.body;

    if (!username || !pwd || !pwd2 || !ques) {
        res.send(exception.alertWindow("입력되지 않은 정보가 있습니다.", "/auth/signup"));
        return;
    } else if (username.length < 8 || pwd.length < 8 || ques.length < 2) {
        res.send(exception.alertWindow("아이디와 패스워드는 8자 이상, 학교 이름은 2자 이상 입력해 주세요!", "/auth/signup"));
        return;
    } else if (username.length > 50 || pwd.length > 255 || ques.length > 255) {
        res.send(exception.alertWindow("아이디는 50자, 패스워드, 초등학교는 255자까지 입력 가능합니다!", "/auth/signup"));
        return;
    }

    if (filter.filtering(username) || filter.filtering(pwd) || filter.filtering(pwd2) || filter.filtering(ques)) {
        res.send(exception.alertWindow("적절하지 않은 문자가 있습니다.", "/auth/signup"));
        return false;
    }
    db.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
            return;
        }
        let hashAlgorithm = crypto.createHash('sha512');
        let hashing = hashAlgorithm.update(pwd);
        let hashedPwd = hashing.digest('base64');
        
        let hashAlgorithm2 = crypto.createHash('sha512');
        let hashing2 = hashAlgorithm2.update(ques);
        let hashedQues = hashing2.digest('base64');

        if (results.length <= 0 && pwd === pwd2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
            db.query('INSERT INTO users (username, password, school) VALUES(?,?,?)', [username, hashedPwd, hashedQues], function (error, data) {
                if (error) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
                    return;
                }

                res.send(exception.alertWindow("회원가입이 완료되었습니다!", "/"));
            });
        } else if (pwd !== pwd2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(exception.alertWindow("입력된 비밀번호가 서로 다릅니다.", "/auth/signup"));    
        } else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(exception.alertWindow("이미 존재하는 아이디 입니다.", "/auth/signup"));    
        }
    });
});

router.get('/change', function(req, res) {
    const filePath = path.join(__dirname, '../templates/password.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
});

router.post('/change_process', function(req, res) {
    let {username, school, pwd, pwd2} = req.body;

    if (!username || !pwd || !pwd2 || !school) {
        res.send(exception.alertWindow("입력되지 않은 정보가 있습니다.", "/auth/login"));
        return;
    } else if (username.length < 8 || pwd.length < 8 || school.length < 2) {
        res.send(exception.alertWindow("아이디와 패스워드는 8자 이상, 학교 이름은 2자 이상 입력해 주세요!", "/auth/login"));
        return;
    } else if (username.length > 50 || pwd.length > 255 || school.length > 255) {
        res.send(exception.alertWindow("아이디는 50자, 패스워드, 초등학교는 255자까지 입력 가능합니다!", "/auth/login"));
        return;
    }
    if (filter.filtering(username) || filter.filtering(pwd) || filter.filtering(pwd2) || filter.filtering(school)) {
        res.send(exception.alertWindow("적절하지 않은 문자가 있습니다.", "/auth/login"));
        return false;
    }

    db.query('SELECT school FROM users WHERE username = ?', [username], function(error, results, fields) {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
            return;
        }
        let hashAlgorithm = crypto.createHash('sha512');
        let hashing = hashAlgorithm.update(pwd);
        let hashedPwd = hashing.digest('base64');
        
        let hashAlgorithm2 = crypto.createHash('sha512');
        let hashing2 = hashAlgorithm2.update(school);
        let hashedSchool = hashing2.digest('base64');

        if (results.length > 0 && pwd === pwd2) {     // DB에 같은 이름의 회원아이디가 있고, 비밀번호가 올바르게 입력된 경우 
            if (results[0].school !== hashedSchool) {
                res.send(exception.alertWindow("입력된 학교 정보가 서로 다릅니다.", "/auth/login"));
                return;
            }

            db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPwd, username], (error, results, fields) => {
                if (error) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
                    return;
                }
                if (results.length === 0) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "/auth/login"));
                    return;
                }
                res.send(exception.alertWindow("비밀번호가 변경되었습니다.", "/auth/login"));
            });
        } else if (pwd !== pwd2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
            res.send(exception.alertWindow("입력된 비밀번호가 서로 다릅니다.", "/auth/login"));    
        } else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
            res.send(exception.alertWindow("존재하지 않는 아이디입니다.", "/auth/login"));    
        }
    });
});

module.exports = router;
