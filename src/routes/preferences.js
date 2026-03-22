const express = require('express');

const router = express.Router();

const User = require('../models/user');
const auth = require("../middlewares/auth");

router.get('/theme', auth, async (req, res) => {
    try {
        const user = await User.find();
        res.status(200).json({ theme: user.theme });
    } catch (err) {
        console.log("Error: " + err.message);
        res.status(500).send();
    }
});

router.post('/theme', auth, async (req, res) => {
    try {
        const user = await User.find();
        try {
            user.theme = req.body.theme;
            await user.save();
            res.status(200).json({ theme: user.theme });
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
