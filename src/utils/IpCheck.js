module.exports = {
    isSameIP: (req, res) => {
        if (req.session.clientIP == req.ip) {
            return true;
        } else {
            return false;
        }
    }
}