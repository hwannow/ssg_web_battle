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

const rotate = () => {
$c.style.transform = `initial`;
$c.style.transition = `initial`;

    setTimeout(() => {
        
        const ran = Math.floor(Math.random() * product.length);

        const arc = 360 / product.length;
        const rotate = (ran * arc) + 3600 + (arc * 3) - (arc/4);
        
        $c.style.transform = `rotate(-${rotate}deg)`;
        $c.style.transition = `2s`;
        
        setTimeout(() => alert(`축하합니다! "${product[ran]}"를 얻으셨습니다! 당사자에게 문의하세요! `), 2000);
    }, 1);
};

router.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "../auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "../auth/logout"));
        return false;
    }
    const filePath = path.join(__dirname, '../templates/roulette.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
        res.send(html);
    });
})

router.post('/run_process', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "../auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "../auth/logout"));
        return false;
    }
    let id = req.session.nickname;

    db.query('SELECT coin FROM users WHERE id = ?', [id], function(error, results, fields) {
        if(error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", '../articles'));
        	return;
	    }
        const coin = results[0];
        if (coin >= 9) {
            rotate();
            db.query('UPDATE users SET coin = ? WHERE id = ?', [coin - 9, id], function(error, results, fileds) {
                if (error) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "../articles"));
                    return;
                }
            });
        }
        else {
            res.send(exception.alertWindow("코인이 부족합니다.", "../articles"));
        }
    });
});

module.exports = router;