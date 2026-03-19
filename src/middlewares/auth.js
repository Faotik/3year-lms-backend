require('dotenv').config()

const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    //Get access token
    const accessToken = req.cookies['accessToken'];

    if (accessToken == null) {
        return res.status(400).send();
    }

    //Verify access token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err != null) {
            return res.status(400).send();
        }

        //Add user(id and role) to request
        req.user = user;
        next();
    })
}

module.exports = authMiddleware;