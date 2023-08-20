const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const router = express.Router();
const session = require('express-session');

const db = require('../utils/database');
const authCheck = require('../utils/authCheck.js');
const exception = require('../utils/exception.js');

require('dotenv').config();

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + '/../../uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        cb(null, uniqueSuffix.toString() + ".jpeg")
    }
});

const upload = multer({ storage: storage });
function escapeHtml(text) {
    let map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

//게시판 페이지 GET
router.get('/', (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        res.redirect('/auth/login');
        return false;
    }
    
    db.query('SELECT * FROM articles', (error, rows) => {
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
                <a href="articles/${id}"><h2>${escapeHtml(title)}</h2></a>
                <p>Author: ${escapeHtml(author)}</p>
                <p>Created At: ${createdAt}</p>
                <p>${escapeHtml(content)}</p>
                </div>
                <hr>
            `;
            html += articleHtml;
        });

        res.send(html);
    });
})

router.get('/new', (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        res.redirect('/auth/login');
        return false;
    }

    const filePath = path.join(__dirname, '../templates/articleForm.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
        res.send(html);
    });
})

// POST 요청 처리
router.post('/new', upload.single('image'), (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/articles/new"));
        return;
    }
    
    const {title, content, author} = req.session.nickname;
    let imagePath = '';

    if(req.file !== undefined) {
        if (!req.file.originalname.endsWith('.jpeg')) {
            res.send(exception.alertWindow("jpeg 파일만 업로드 가능합니다.", "/articles/new"));
            return;
        }
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            imagePath += req.file.path.slice(startIndex); 
        }
    }
  
    if (title && content) {
        if (title.length <= 1 || content.length <= 1) {
            res.send(exception.alertWindow("더 길게 입력해 주세요!", "/articles/new"));
            return;
        } else if (title.length > 100 || content.length > 100) {
            res.send(exception.alertWindow("제목과 내용은 100자까지 입력 가능합니다.", "/articles/new"));
            return;
        } else {
            db.query('INSERT INTO articles (title, content, author, image_path) VALUES (?, ?, ?, ?)', [title, content, author, imagePath], function(error, results, fields) {
                if (error) throw error; 
            });
        }
    } else {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", "/articles/new"));
            return;
        }
  
    res.redirect('/articles');
});
  
router.get('/:id', (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        return false;
    }

    const articlesId = req.params.id;

    db.query('SELECT * FROM articles WHERE id =' + articlesId, (error, rows) => {
        if (error) throw error;
        
        const id = rows[0].id;
        const title = rows[0].title;
        const content = rows[0].content;
        const author = rows[0].author;
        const createdAt = rows[0].created_at;
        const imagePath = rows[0].image_path;
        
        let html = `
            <h1>Articles</h1>
            <p><a href="/main">홈으로</a></p>
            <p><a href="/articles/new">글 작성</a></p>
            <div>
                <h2>${escapeHtml(title)}</h2>
        `;

        if(req.session.nickname == author) {
            html += `
                <form action="/articles/delete/${id}" method="post">
                <p><input class="delete_btn" type="submit" value="글 삭제"></p>
                </form>
                <a href="/articles/${id}/update">글 수정하기</a>
            `
        }

        html += `
                <p>Author: ${escapeHtml(author)}</p>
                <p>Created At: ${createdAt}</p>
                <p>${escapeHtml(content)}</p>    
            </div>
        `;      

        if (imagePath.length > 0) html += `<img src="/../../uploads/${imagePath}" alt="Uploaded Image"></img>`
        
        html += `
            <hr>
            <h3>댓글 작성</h3>
            <form action="/comments/new" method="POST">
                <input type="text" name="content" placeholder="댓글 내용">
                <input type="hidden" name="articlesId" value="${articlesId}">
                <input type="hidden" name="usersId" value="${req.session.usersId}">
                <button type="submit">작성</button>
            </form>
        `;

        db.query('SELECT comments.id, comments.content, users.username FROM comments INNER JOIN users ON comments.users_id = users.id WHERE comments.articles_id =' + articlesId, function(error, commentRows) {
            if (error) throw error;
          
            html += `
                <h3>댓글</h3>
            `;

            for (let i = 0; i < commentRows.length; i++) {
                const commentContent = commentRows[i].content;
                const commentAuthor = commentRows[i].username;
            
                html += `
                    <div>
                        <p>작성자: ${escapeHtml(commentAuthor)}</p>
                        <p>${escapeHtml(commentContent)}</p>
                        <hr>
                    </div>
                `;
            }
          
            res.send(html);
        });
    });
})

router.post('/delete/:id', (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        return false;
    }
    const id = req.params.id; 
    let delete_image = "";

    db.query('SELECT image_path FROM articles where id = ?', [id] , (error, results, fields) => {
       delete_image = results[0].image_path;
    });

    db.query('DELETE FROM articles where id =' + id, (error, commentRows) => {
        if (error) throw error;
        if (delete_image.length > 0) console.log("이미지 삭제 코드 추가");
    });
    
    res.redirect('/articles');
});

router.get('/:id/update', (req, res) => {
    if (!authCheck.isOwner(req, res)) {
        return false;
      }

    const id = req.params.id; 

    db.query('SELECT * FROM articles WHERE id = ' + id, (error, rows) => {
        if(error) throw error;

        const {id, title, content, author, createdAt, imagePath} = rows[0];
        
        let html = `
            <h1>Articles</h1><p><a href="/main">홈으로</a></p><p><a href="/articles/new">글 작성</a></p>
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
                <input type="file" name="image" value="${imagePath}">
            </div>
            <button type="submit">글 작성</button>
            </form>
        `;

        res.send(html);
    });
});
  

router.post('/:id/update', upload.single('image'), (req, res) => {
    if (!authCheck.isOwner(req, res)) {
      return false;
    }
  
    const id = req.params.id; 
    let title = req.body.title;
    let content = req.body.content;
    let imagePath = '';

    if(req.file != undefined) {
        if (!req.file.originalname.endsWith('.jpeg')) {
            res.send(exception.alertWindow("jpeg 파일만 업로드 가능합니다.", "/articles/:id/update"));
            return;
        }
        console.log(req.file.path);
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            imagePath += req.file.path.slice(startIndex); 
        }
    }

    if (title && content) {
        if (title.length <= 1 || content.length <= 1) {
            res.send(exception.alertWindow("더 길게 입력해 주세요!", "/articles/new"));
            return;
        } else if (title.length > 100 || content.length > 100) {
            res.send(exception.alertWindow("제목과 내용은 100자까지 입력 가능합니다.", "/articles/new"));
            return;
        }
        db.query('UPDATE articles SET title = ?, content = ?, image_path = ? WHERE id = ?', [title, content, imagePath, id], (error, results, fields) => {
            if (error) throw error;
          });
    } else {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", "/articles/new"));
    }
  
    res.redirect('/articles');
});


module.exports = router;

