module.exports = {
    filtering: (input) => {
        const arr = ["'", '"', "|", "<", ">", "?", "*", "--", "#", ";", "/", "select", "where", "show", "update", "insert", "script", "src", "style", "href"];
        for (let key of arr) {
            if (input.includes(key)) return true;
            console.log(key);
        }
        return false;
    }
}