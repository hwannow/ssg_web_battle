const express = require('express');
const router = express.Router();

const db = require('../utils/database');
const authCheck = require('../utils/authCheck.js');
const exception = require('../utils/exception.js');
const filter = require('../utils/filter.js');
const IpCheck = require('../utils/IpCheck.js');

router.post('/new', function(req, res) {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return false;
    }

    let {content, usersId, articlesId} = req.body;

    if(!articlesId || !content || !usersId) {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", `/articles/${articlesId}`));
        return false;
    } else if (content.length <=1) {
        res.send(exception.alertWindow("더 길게 입력해 주세요!", `/articles/${articlesId}`));
        return false;
    } else if (content.length >= 255) {
        res.send(exception.alertWindow("너무 길어요!", `/articles/${articlesId}`));
        return false;
    } else if (filter.filtering(content)) {
        res.send(exception.alertWindow("부적절한 단어가 포함되어 있어요!", `/articles/${articlesId}`));
        return false;
    }

    db.query('INSERT INTO comments (content, users_id, articles_id) VALUES (?, ?, ?)', [content, usersId, articlesId], function(error, results, fields) {
        if(error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", '/articles'));
        	return;
	}
        res.redirect('/articles/' + articlesId);
    });
  
})

module.exports = router;
