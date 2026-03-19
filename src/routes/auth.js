const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user')

router.post('/register', async (req, res) => {
    try {
        const hashed_password = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashed_password,
            role: req.body.role,
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.where("email").equals(req.body.email);

        if (user != null && bcrypt.compare(req.body.password, user.password)) {
            res.status(200).send();
        }
        else {
            return res.status(400).send("Incorrect login credentials");
        }

    } catch (err) {
        res.status(400).json({ message: err.message })
    }
});

module.exports = router;
