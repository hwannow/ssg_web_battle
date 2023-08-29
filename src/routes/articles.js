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

require('dotenv').config();

const multer = require('multer');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, __dirname + '/../../uploads/')
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
            cb(null, uniqueSuffix.toString() + ".jpeg")
        },
    }),
    limits: {fileSize : 5 * 1024 * 1024},
    fileFilter: function(req, file, done) {
        if (file.mimetype.lastIndexOf('jpeg') > -1) {
            done(null, true);
        } else if (file.originalname.includes('/')) {
            done(null, false);
        } else {
            done(null, false);
        }
    }

});

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

//게시판 페이지 GET
router.get('/', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }
    db.query('SELECT * FROM articles', (error, rows) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        
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
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }

    const filePath = path.join(__dirname, '../templates/articleForm.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
        res.send(html);
    });
})

// POST 요청 처리
router.post('/new', upload.single('image'), (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }
    
    const {title, content} = req.body;
    const author = req.session.nickname;
    let imagePath = '';

    if(req.file !== undefined) {
        // if (!req.file.originalname.endsWith('.jpeg')) {
        //     res.send(exception.alertWindow("jpeg 파일만 업로드 가능합니다.", "/articles/new"));
        //     return;
        // } 
        // if (req.file.originalname.includes('/')){
        //     res.send(exception.alertWindow("적절하지 않은 파일명입니다.", "/articles/new"));
        //     return;
        // }
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            imagePath += req.file.path.slice(startIndex); 
        }
    }

    if (title && content) {
        if (title.length <= 1 || content.length <= 1) {
            res.send(exception.alertWindow("더 길게 입력해 주세요!", "/articles/new"));
        } else if (title.length > 100 || content.length > 100) {
            res.send(exception.alertWindow("제목과 내용은 100자까지 입력 가능합니다.", "/articles/new"));
        } else if (filter.filtering(title) || filter.filtering(content)) {
            res.send(exception.alertWindow("적절하지 않은 문자가 포함되어 있습니다.", "/articles/new"));
        } else {
            db.query('INSERT INTO articles (title, content, author, image_path) VALUES (?, ?, ?, ?)', [title, content, author, imagePath], function(error, results, fields) {
                if (error) {
                    res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
                    return;
                }
                res.redirect('/articles');
            });
        }
    } else {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", "/articles/new"));
    }
  
});
  
router.get('/:id', (req, res) => {
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }

    const articlesId = req.params.id;

    if (filter.filtering(articlesId)) {
        res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
        return;
    }

    db.query('SELECT * FROM articles WHERE id = ?', [articlesId], (error, rows) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        if (rows.length === 0) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
            return;
        }

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

        if(req.session.nickname === author) {
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

        if (imagePath) html += `<img src="/../../uploads/${imagePath}" alt="Uploaded Image"></img>
        <a href="/articles/download/${id}">파일 다운로드</a>
        `
        
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

        db.query('SELECT comments.id, comments.content, users.username FROM comments INNER JOIN users ON comments.users_id = users.id WHERE comments.articles_id = ?', [articlesId], function(error, commentRows) {
            if (error) {
                res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
                return;
            }
          
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

router.get('/download/:id', (req,res) => {
    const articleId = req.params.id; 

    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (filter.filtering(articleId)) {
        res.send(exception.alertWindow("부적절한 접근입니다.", "/articles"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }

    db.query('SELECT * FROM articles WHERE id = ?', [articleId], (error, results) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        if (results.length === 0) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
            return;
        }
        const image_path = results[0].image_path;
        const file = `/../../uploads/${image_path}`
        res.download(file);
    });
});

router.post('/delete/:id', (req, res) => {
    
    // check session connection
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }

    const articlesId = req.params.id; 

    db.query('SELECT author, image_path FROM articles where id = ?', [articlesId] , (error, results, fields) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        if (results.length === 0) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
            return;
        }
        
        const {author, image_path} = results[0];
        
        // check author and request user are same
        if(!authCheck.isOwner(req, res, author)) {
            res.send(exception.alertWindow("사용자 정보가 일치하지 않습니다.", `/articles/${id}`));
            return;
        }

        // delete image if exist
        if(image_path) {
            const filePath = path.join(__dirname, `../../uploads/${image_path}`);
            fs.unlink(filePath, (err) => {
                if (err) console.error(err);
            });    
        }
        
        // delete articles data in DB
        db.query('DELETE FROM articles where id = ?', [articlesId], (error, results) => {
            if (error) {
                res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
                return;
            }
            if (results.length === 0) {
                res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
                return;
            }
        });

        res.redirect('/articles');
    });
});

router.get('/:id/update', (req, res) => {
    const articleId = req.params.id; 

    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }
    if (filter.filtering(articleId)) {
        res.send(exception.alertWindow("부적절한 접근입니다.", "/articles"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }

    db.query('SELECT * FROM articles WHERE id = ?', [articleId], (error, results) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        if (results.length === 0) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
            return;
        }

        const {id, author, title, content, image_path} = results[0];
    
        if (!authCheck.isOwner(req, res, author)) {
            res.send(exception.alertWindow("사용자 정보가 일치하지 않습니다.", `/articles/${req.params.id}`));
            return;
        }
        
        res.send(`
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
                <input type="file" name="image" value="${image_path}">
            </div>
            <button type="submit">글 작성</button>
            </form>
        `);
    });
});
  

router.post('/:id/update', upload.single('image'), (req, res) => {

    const articleId = req.params.id; 
    const {title, content} = req.body;

    // check session connection
    if (!authCheck.isLogined(req, res)) {
        res.send(exception.alertWindow("로그인 정보가 잘못됐습니다.", "/auth/login"));
        return;
    }

    // filtering input
    if (filter.filtering(articleId)) {
        res.send(exception.alertWindow("부적절한 접근입니다.", "/articles"));
        return;
    }
    if (!IpCheck.isSameIP(req, res)){
        res.send(exception.alertWindow("다시 로그인해 주세요!", "/auth/logout"));
        return;
    }
    if (!title || !content) {
        res.send(exception.alertWindow("입력되지 않은 값이 있습니다.", `/articles/${articleId}/update`));
        return;
    }       
    
    if (title.length <= 1 || content.length <= 1) {
        res.send(exception.alertWindow("더 길게 입력해 주세요!", `/articles/${articleId}/update`));
        return;
    } 

    if (title.length > 100 || content.length > 100) {
        res.send(exception.alertWindow("제목과 내용은 100자까지 입력 가능합니다.", `/articles/${articleId}/update`));
        return;
    } 
    
    if (filter.filtering(title) || filter.filtering(content)) {
        res.send(exception.alertWindow("적절하지 않은 문자가 포함되어 있습니다.", `/articles/${articleId}/update`));
        return;
    } 

    let finalImagePath = null;

    if(req.file != undefined) {
        // if (!req.file.originalname.endsWith('.jpeg')) {
        //     res.send(exception.alertWindow("jpeg 파일만 업로드 가능합니다.", `/articles/${articleId}/update`));
        //     return;
        // }
        // else if (req.file.originalname.includes('/')){
        //     res.send(exception.alertWindow("적절하지 않은 파일명입니다.", "/articles/new"));
        // }
        const startIndex = req.file.path.indexOf('uploads') + 8;
        if (startIndex !== -1) {
            finalImagePath = req.file.path.slice(startIndex); 
        }
    }

    db.query('SELECT author, image_path FROM articles WHERE id = ?', [articleId], (error, results, field) => {
        if (error) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
            return;
        }
        if (results.length === 0) {
            res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
            return;
        }
        const {author, image_path} = results[0];

        // check author and request user are same
        if (!authCheck.isOwner(req, res, author)) {
            res.send(exception.alertWindow("사용자 정보가 일치하지 않습니다.", `/articles/${req.params.id}`));
            return;
        }

        /* if no file uploaded in current request, inherit.
            else if file exist in current request & old image exist, delete old file
        */
        if (!finalImagePath) {
            finalImagePath = image_path;
        } else if (image_path) {
            const filePath = path.join(__dirname, `../../uploads/${image_path}`);
            fs.unlink(filePath, (err) => {if (err) console.error(err);});
        }


        db.query('UPDATE articles SET title = ?, content = ?, image_path = ? WHERE id = ?', [title, content, finalImagePath, articleId], (error, results, fields) => {
            if (error) {
                res.send(exception.alertWindow("잘못된 접근입니다.", "/articles"));
                return;
            }
            if (results.length === 0) {
                res.send(exception.alertWindow("잘못된 접근입니다.", "/main"));
                return;
            }
            res.redirect('/articles');
        });
    });
});


module.exports = router;

