const express = require('express');

const router = express.Router();

const User = require('../models/user');
const authMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');

router.get('/theme', authMiddleware(), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ theme: user.preferences.theme });
    } catch (err) {
        console.log("Error: " + err.message);
        res.status(500).send();
    }
});

router.post('/theme', authMiddleware(), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        try {
            user.preferences.theme = req.body.theme;
            await user.save();
            res.status(200).json({ theme: user.preferences.theme });
        }
        catch (err) {
            res.status(400).send("Invalid theme");
        }
    } catch (err) {
        console.log("Error: " + err.message);
        res.status(500).send();
    }
});

module.exports = router;
