const fs = require('fs');
const path = require('path');
var express = require('express');
var router = express.Router();
const session = require('express-session');
const FileStore = require('session-file-store')(session);

var db = require('../utils/database');
var authCheck = require('../utils/authCheck.js');

router.post('/new', function(req, res) {
    if (!authCheck.isOwner(req, res)) {
        return false;
    }

    let content = req.body.content;
    let usersId = req.body.usersId;
    let articlesId = req.body.articlesId;

    if(articlesId && content && usersId) {
        if (content.length <=1) {
            res.send(`<script type="text/javascript">alert("더 길게 입력해 주세요!"); 
            document.location.href="/articles/${req.body.articlesId}";</script>`);
            return;
        } else if (content.length >= 255) {
            res.send(`<script type="text/javascript">alert("너무 길어요!"); 
            document.location.href="/articles/${req.body.articlesId}";</script>`);
            return;
        }
        db.query('INSERT INTO comments (content, users_id, articles_id) VALUES (?, ?, ?)', [content, usersId, articlesId], function(error, results, fields) {
            if(error) throw error;
        });
    } else {
        res.send(`<script type="text/javascript">alert("입력되지 않은 값이 있습니다."); 
            document.location.href="/articles/${req.body.articlesId}";</script>`);
    }

    res.redirect('/articles/' + req.body.articlesId);
})

module.exports = router;
