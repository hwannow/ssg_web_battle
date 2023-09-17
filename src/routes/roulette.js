const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const router = express.Router();
const session = require('express-session');

const db = require('../utils/database');
const authCheck = require('../utils/authCheck.js');
const exception = require('../utils/exception.js');
const filter = require('../utils/filter.js');
const IpCheck = require('../utils/IpCheck.js');

router.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return false;
    }
    const filePath = path.join(__dirname, '../templates/roulette.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
        db.query('SELECT coin FROM users WHERE id = ?', [req.session.usersId], function(error, results, fields) { 
            if (error) {
                res.send(html);
                return;
            }
            const coin = results[0].coin;
            if (coin >= 9) {
                html += `
                    <button onclick="rotate()">룰렛 돌리기</button>
                `
            }
            html += `
                <h3>현재 가진 코인: ${coin}</h3>
            `
            res.send(html);
        });
    });
})

router.post('/run_process', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return false;
    }
    let id = req.session.usersId;

    db.query('SELECT coin FROM users WHERE id = ?', [id], function(error, results, fields) {
        if(error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", '/articles'));
        	return;
	    }
        const coin = results[0].coin;
        if (coin >= 9) {
            db.query('UPDATE users SET coin = ? WHERE id = ?', [coin - 9, id], function(error, results, fileds) {
                if (error) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
                    return;
                }
                res.redirect("/roulette");
                return;
            });
        }
        else {
            res.send(exception.alertWindow("코인이 부족합니다.", "/articles"));
            return;
        }
    });
});

module.exports = router;