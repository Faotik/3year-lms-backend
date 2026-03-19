const express = require('express');
const router = express.Router();

const User = require('../models/user')

router.post('/register', async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      age: req.body.age
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
});

module.exports = router;
