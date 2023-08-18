const fs = require('fs');
const path = require('path');
var express = require('express');
var router = express.Router();
const session = require('express-session');
const FileStore = require('session-file-store')(session);

var db = require('../utils/database');
var authCheck = require('../utils/authCheck.js');

const multer = require('multer');
const { request } = require('http');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/../uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const upload = multer({ storage: storage });


router.get('/', function(req, res) {
    if (!authCheck.isOwner(req, res)) {
        res.redirect('/auth/login');
        return false;
    }
    
    db.query('SELECT * FROM articles', function(error, rows) {
        if (error) throw error;
        
        let html = `
            <h1>Articles</h1>
            <p><a href="/main">홈으로</a></p>
            <p><a href="/articles/new">글 작성</a></p>
        `;

        rows.reverse().forEach((row) => {
            const id = row.id;
            const title = row.title;
            const content = row.content;
            const author = row.author;
            const createdAt = row.created_at;

            const articleHtml = `
                <div>
                <a href="articles/${id}"><h2>${title}</h2></a>
                <p>Author: ${author}</p>
                <p>Created At: ${createdAt}</p>
                <p>${content}</p>
                </div>
                <hr>
            `;
            html += articleHtml;
        });

        res.send(html);
    });
})

router.get('/new', function(req, res) {
    if (!authCheck.isOwner(req, res)) {
        res.redirect('/auth/login');
        return false;
    }

    const filePath = path.join(__dirname, '../templates/articleForm.html');
    fs.readFile(filePath, 'utf8', function (err, html) {
        res.send(html);
    });
})

// POST 요청 처리
router.post('/new', upload.single('image'), function(req, res) {
    if (!authCheck.isOwner(req, res)) {
      return false;
    }
  
    let title = req.body.title;
    let content = req.body.content;
    let author = req.body.author;
    let imagePath = '';

    if(req.file != undefined) {
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            imagePath += req.file.path.slice(startIndex); 
        }
    }
  
    if (title && content && author) {
      db.query('INSERT INTO articles (title, content, author, image_path) VALUES (?, ?, ?, ?)', [title, content, author, imagePath], function(error, results, fields) {
        if (error) throw error;
      });
    }
  
    res.redirect('/articles');
});
  
router.get('/:id', function(req, res) {
    if (!authCheck.isOwner(req, res)) {
      return false;
    }

    const articlesId = req.params.id;

    db.query('SELECT * FROM articles WHERE id =' + articlesId, function(error, rows) {
        if (error) throw error;
        
        let html = '<h1>Articles</h1><p><a href="/main">홈으로</a></p><p><a href="/articles/new">글 작성</a></p>';
        const id = rows[0].id;
        const title = rows[0].title;
        const content = rows[0].content;
        const author = rows[0].author;
        const createdAt = rows[0].created_at;
        const imagePath = rows[0].image_path;
        let articleHtml = `
        <div>
            <h2>${title}</h2>
            <form action="/articles/delete/${id}" method="post">
            <p><input class="delete_btn" type="submit" value="글 삭제"></p>
        `;

        if(req.session.nickname == author) {
            articleHtml += `
            <a href="/articles/${id}/update">글 수정하기</a>
            `
        }

        articleHtml += `
            <p>Author: ${author}</p>
            <p>Created At: ${createdAt}</p>
            <p>${content}</p>
            <img src="/../uploads/${imagePath}" alt="Uploaded Image">
        </div>
        <hr>
        `;      
        html += articleHtml;

        const commentFormHtml = `
            <h3>댓글 작성</h3>
            <form action="/comments/new" method="POST">
            <input type="text" name="content" placeholder="댓글 내용">
            <input type="hidden" name="articlesId" value="${articlesId}">
            <input type="hidden" name="usersId" value="${req.session.usersId}">
            <button type="submit">작성</button>
            </form>
        `;

        html += commentFormHtml;

        db.query('SELECT comments.id, comments.content, users.username FROM comments INNER JOIN users ON comments.users_id = users.id WHERE comments.articles_id =' + articlesId, function(error, commentRows) {
            if (error) throw error;
          
            html += '<h3>댓글</h3>';
            for (let i = 0; i < commentRows.length; i++) {
              const commentId = commentRows[i].id;
              const commentContent = commentRows[i].content;
              const commentAuthor = commentRows[i].username;
          
              const commentHtml = `
                <div>
                <p>작성자: ${commentAuthor}</p>
                <p>${commentContent}</p>
                </div>
              `;
              html += commentHtml;
            }
          
            res.send(html);
          });
    });
})

router.post('/delete/:id', function(req, res) {
    const id = req.params.id; 
   
    db.query('DELETE FROM articles where id =' + id, function(error, commentRows) {
        if (error) throw error;
    });
    
    res.redirect('/articles');
});

router.get('/:id/update', function(req, res) {
    const id = req.params.id; 

    db.query('SELECT * FROM articles WHERE id = ' + id, function(error, rows) {
        if(error) throw error;

        let html = '<h1>Articles</h1><p><a href="/main">홈으로</a></p><p><a href="/articles/new">글 작성</a></p>';
        const id = rows[0].id;
        const title = rows[0].title;
        const content = rows[0].content;
        const author = rows[0].author;
        const createdAt = rows[0].created_at;
        const imagePath = rows[0].image_path;
        html += `
            <h1>글 수정</h1>
            <form action="/articles/${id}/update" method="post" enctype="multipart/form-data">
            <div>
                <label for="title">제목</label>
                <input type="text" id="title" name="title" value="${title}">
            </div>
            <div>
                <label for="content">내용</label>
                <textarea id="content" name="content" rows="5">${content}</textarea>
            </div>
            <div>
                <label for="author">작성자</label>
                <input type="text" id="author" name="author" value="${author}">
            </div>
            <div>
                <input type="file" name="image" value="${imagePath}">
            </div>
            <button type="submit">글 작성</button>
            </form>
        `;

        res.send(html);
    });
});
  

router.post('/:id/update', upload.single('image'), function(req, res) {
    if (!authCheck.isOwner(req, res)) {
      return false;
    }
  
    const id = req.params.id; 
    let title = req.body.title;
    let content = req.body.content;
    let author = req.body.author;
    let imagePath = '';

    if(req.file != undefined) {
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            imagePath += req.file.path.slice(startIndex); 
        }
    }

    if (title && content && author) {
      db.query('UPDATE articles SET title = ?, content = ?, author = ?, image_path = ? WHERE id = ?', [title, content, author, imagePath, id], function(error, results, fields) {
        if (error) throw error;
      });
    }
  
    res.redirect('/articles');
});


module.exports = router;

