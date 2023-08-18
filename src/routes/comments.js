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
        db.query('INSERT INTO comments (content, users_id, articles_id) VALUES (?, ?, ?)', [content, usersId, articlesId], function(error, results, fields) {
            if(error) throw error;
        });
    }

    res.redirect('/articles/' + req.body.articlesId);
})

module.exports = router;
