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
    const user = await User.find({ email: req.body.email });

    //Verify if user exist and if password is correct
    if (user != null && bcrypt.compare(req.body.password, user.password)) {
        //Create access and refresh tokens
        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
        const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET);

        //Add refresh token to the list of valid tokens user has
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('accessToken', accessToken, { maxAge: 15 * 60 * 1000, httpOnly: true });
        res.cookie('refreshToken', refreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        res.status(200).send();
    }
    else {
        return res.status(400).send("Incorrect login credentials");
    }
});

router.post('/refreshtoken', async (req, res) => {
    //Find user in db
    const user = await User.findOne({ refreshTokens: req.body.refreshToken });

    //No user with such refresh token. Refresh token is invalid
    if (user == null) {
        return res.status(400).send();
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        //Refresh token is invalid
        if (err != null) {
            return res.status(400);
        }

        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });

        res.cookie('accessToken', accessToken, { maxAge: 15 * 60 * 1000, httpOnly: true });
        res.status(200).send();
    })
});

router.post('/logout', authMiddleware, async (req, res) => {
    //Find user in db
    const user = await User.findOne({ id: req.user.id });

    //Remove refresh token from valid list
    user.refreshTokens.remove(req.body.refreshToken);
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).send();
});

module.exports = router;
