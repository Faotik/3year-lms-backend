require('dotenv').config()

const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const accessToken = req.cookies['accessToken'];
    if (accessToken == null) {
        return res.status(400).send();
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err != null) {
            return res.status(400).send();
        }

        req.user = user;
        next();
    })
}

module.exports = authMiddleware;