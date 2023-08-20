const express = require('express');
const router = express.Router();

const db = require('../utils/database');
const authCheck = require('../utils/authCheck.js');
const exception = require('../utils/exception.js');

router.post('/new', function(req, res) {
    if (!authCheck.isOwner(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }

    let {content, usersId, articlesId} = req.body;

    if(!articlesId || !content || !usersId) {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", "/articles/${req.body.articlesId}"));
    } else if (content.length <=1) {
        res.send(exception.alertWindow("더 길게 입력해 주세요!", "/articles/${req.body.articlesId}"));
    } else if (content.length >= 255) {
        res.send(exception.alertWindow("너무 길어요!", "/articles/${req.body.articlesId}"));
    }

    db.query('INSERT INTO comments (content, users_id, articles_id) VALUES (?, ?, ?)', [content, usersId, articlesId], function(error, results, fields) {
        if(error) throw error;
        res.redirect('/articles/' + req.body.articlesId);
    });
  
})

module.exports = router;
