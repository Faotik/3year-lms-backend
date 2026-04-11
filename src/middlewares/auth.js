require('dotenv').config()

const ROLES = require('../constants/roles');

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        if (req.session.user) {
            if (roles.length === 0 ||
                roles.includes(req.session.user.role) ||
                req.session.user.role === ROLES.ADMIN) {

                req.user = req.session.user;
                next();
            } else {
                return res.status(403).send("Access forbidden");
            }


        }
        else {
            return res.status(401).send("Not authenticated");
        }
    }
}

module.exports = authMiddleware;