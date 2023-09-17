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
const { error } = require('console');

const getOutHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /admin</pre>
</body>
</html>
`;

function escapeHtml(text) {
    let map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        " ": '&nbsp;',
        "!": '&#33;',
        "#": '&#35;',
        "$": '&#36;',
        "(": '&#40;',
        ")": '&#41;',
        "|": "&#124",
    	"`": "&#96;"
    };
    if (text == null) return;
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

router.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!authCheck.isAdmin(req)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.status(404).send(getOutHtml);
        return;
    }

    res.send(`
        <a href="/admin/users">사용자 목록</a>
        <a href="/admin/articles">글 목록</a>
        <a href="/admin/comments">댓글 목록</a>
    `);
})


router.get('/users', (req,res) => {
    if (!authCheck.isLogined(req, res)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!authCheck.isAdmin(req)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.status(404).send(getOutHtml);
        return;
    }
    
    db.query("SELECT * FROM USERS",  (error, results) => {
        if (error) {
            res.send(exception.alertWindow("조회에 실패했습니다.", "/"));
            return;
        }

        let html = `
            <table>
                <th>id</th> 
                <th>username</th>
                <th>coin</th>
        `;

        results.forEach(user => {
            html += `
                <tr>
                    <td>${escapeHtml(user.id)}</td>
                    <td>${escapeHtml(user.username)}</td>
                    <td>${escapeHtml(user.coin)}</td>
                </tr>
            `
        });

        html += `</table>`;
        
        res.send(html);
    });
});


router.get('/articles', (req,res) => {
    if (!authCheck.isLogined(req, res)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!authCheck.isAdmin(req)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.status(404).send(getOutHtml);
        return;
    }
    
    db.query("SELECT * FROM ARTICLES",  (error, results) => {
        if (error) {
            res.send(exception.alertWindow("조회에 실패했습니다.", "/"));
            return;
        }

        let html = `
            <table>
                <th>id</th> 
                <th>author</th> 
                <th>createAt</th> 
                <th>selection</th> 
                <th>like</th> 
                <th>title</th>
                <th>content</th>
        `;

        results.forEach(article => {
            html += `
                <tr>
                    <th>${escapeHtml(article.id)}</th> 
                    <th>${escapeHtml(article.author)}</th> 
                    <th>${escapeHtml(article.created_at)}</th> 
                    <th>${escapeHtml(article.selection)}</th> 
                    <th>${escapeHtml(article.like_cnt)}</th> 
                    <th>${escapeHtml(article.title)}</th>
                    <th>${escapeHtml(article.content)}</th>
                </tr>
            `
        });

        html += `</table>`;
        
        res.send(html);
    });
});


router.get('/comments', (req,res) => {
    if (!authCheck.isLogined(req, res)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!authCheck.isAdmin(req)) {
        res.status(404).send(getOutHtml);
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.status(404).send(getOutHtml);
        return;
    }
    
    db.query("SELECT * FROM COMMENTS",  (error, results) => {
        if (error) {
            res.send(exception.alertWindow("조회에 실패했습니다.", "/admin"));
            return;
        }

        let html = `
            <table>
                <th>id</th> 
                <th>user id</th> 
                <th>article id</th> 
                <th>content</th>
        `;

        results.forEach(comment => {
            html += `
                <tr>
                <th>${escapeHtml(comment.id)}</th> 
                <th>${escapeHtml(comment.users_id)}</th> 
                <th>${escapeHtml(comment.articles_id)}</th> 
                <th>${escapeHtml(comment.content)}</th> 
                </tr>
            `
        });

        html += `</table>`;
        
        res.send(html);
    });
});


module.exports = router;
