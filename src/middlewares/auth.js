require('dotenv').config()

const authMiddleware = (req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user;
        next();
    }
    else {
        return res.status(400).send("Not authenticated");
    }
}

module.exports = authMiddleware;