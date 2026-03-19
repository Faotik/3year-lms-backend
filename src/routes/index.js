const express = require('express');
const router = express.Router();

const User = require('../models/user')

router.get('/', async (req, res) => {
  res.status(200).send("Hello, world!");
});

module.exports = router;
