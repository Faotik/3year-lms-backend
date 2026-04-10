const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/user');
const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const Module = require('../models/module');

const authMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');
const bcrypt = require("bcrypt");

// ================= PLATFORM STATISTIC =================

// Get statistic over the platform
router.get('/statistic', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        const totalUserCount = await User.countDocuments();
        const studentCount = await User.countDocuments({ role: ROLES.STUDENT });
        const teacherCount = await User.countDocuments({ role: ROLES.TEACHER });
        const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
        const moduleCount = await Module.countDocuments();
        const assignmentCount = await Assignment.countDocuments();
        const submissionCount = await Submission.countDocuments();

        res.json({
            users: totalUserCount,
            student: studentCount,
            teacher: teacherCount,
            admin: adminCount,
            modules: moduleCount,
            assignments: assignmentCount,
            submissions: submissionCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error occured' });
    }
})

module.exports = router;