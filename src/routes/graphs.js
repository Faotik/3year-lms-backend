//TODO implement activity, change from global stats to personal
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Module = require('../models/module');
const Assignment = require('../models/assignment');
//GET
router.get('/stats', async (req, res) => {
  try {
    const totalModules = await Module.countDocuments();
    const totalUsers = await User.countDocuments();
    const assignmentsDue = await Assignment.countDocuments({
      dueDate: { $gte: new Date() }
    });
    //Temporary until online users are imnplemented
    const onlineUsers = 5;
    res.json({
      totalUsers,
      totalModules,
      assignmentsDue,
      onlineUsers
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;