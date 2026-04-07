require('dotenv').config()

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const User = require('../models/user')
const authMiddleware = require('../middlewares/auth');

router.post('/register', async (req, res) => {
    //Hash password
    const hashed_password = await bcrypt.hash(req.body.password, 10);
    //Add user to db
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashed_password,
        role: req.body.role,
    });
    res.status(200).json({ name: user.name, email: user.email, role: user.role });
});

router.post('/login', async (req, res) => {
    //Find user in db   
    const user = await User.findOne({ email: req.body.email });

    //Verify if user exist and if password is correct
    if (user != null && await bcrypt.compare(req.body.password, user.password)) {
        req.session.user = { id: user.id, role: user.role };
        res.status(200).send("Login successful");
    }
    else {
        return res.status(400).send("Incorrect login credentials");
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    //Logout
    req.session.user = null;

    res.status(200).send("Logout successful");
});

module.exports = router;
