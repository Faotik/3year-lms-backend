require('dotenv').config()

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const User = require('../models/user')
const authMiddleware = require('../middlewares/auth');


router.post('/login', async (req, res) => {
    //Find user in db   
    const user = await User.findOne({ email: req.body.email });

    //Verify if user exist and if password is correct
    if (user != null && await bcrypt.compare(req.body.password, user.password)) {
        req.session.user = { id: user.id, role: user.role };
        res.status(200).send("Login successful");
    }
    else {
        return res.status(401).send("Incorrect login credentials");
    }
});

router.post('/logout', authMiddleware(), async (req, res) => {
    //Logout
    req.session.destroy(() => {
        res.status(200).json({ message: "Logout successful" });
    });
});
router.get('/me', authMiddleware(), (req, res) => res.json(req.session.user));

module.exports = router;
