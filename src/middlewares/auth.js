require('dotenv').config()

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        if (req.session.uses) {
            if ((roles.length > 0 && !roles.includes(req.session.uses.role)) || req.session.uses.role != "admin") {
                return res.status(403).send("Access forbidden");
            }

            req.user = req.session.user;
            next();
        }
        else {
            return res.status(401).send("Not authenticated");
        }
    }
}

module.exports = authMiddleware;