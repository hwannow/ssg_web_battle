module.exports = {
    isOwner: (req, res, author) => {
        return req.session.nickname == author;
    },
    isLogined: (req, res) => {
        if (req.session.is_logined) {
            return true;
        } else {
            return false;
        }
    },
    statusUI: (req, res) => {
        let authStatusUI = '로그인후 사용 가능합니다';
        if (this.isOwner(req, res)) {
            authStatusUI = `${req.session.nickname}님 환영합니다 | <a href="/auth/logout">로그아웃</a>`;
        }
        return authStatusUI;
    },
    isAdmin: (req) => {
        return req.session.nickname == process.env.ADMIN_NICKNAME;
    }
}