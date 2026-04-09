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

// TODO modify user permissions of what modules they can see and access

// ================= ASSIGNMENTS =================

// Get all assignments
router.get('/assignments', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // return all assignments in system to admin
        const assignments = await Assignment.find();
        res.json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Delete assignment
router.delete('/assignments/:id', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // id format validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const deleted = await Assignment.findByIdAndDelete(req.params.id);

        // check assignment existence in system
        if (!deleted) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // remove all submissions linked to assignment
        await Submission.deleteMany({ assignmentId: req.params.id });

        res.json({ message: 'Assignment deleted' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// Update assignment fields
router.put('/assignments/:id', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // Validate Mongo ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const { title, deadline, description } = req.body;

        // Build safe update object (whitelist only)
        const updates = {};

        // Update title if provided
        if (title) {
            if (typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid title' });
            }

            updates.title = title.trim();
        }

        // Update deadline if provided
        if (deadline) {
            const parsedDeadline = new Date(deadline);

            if (isNaN(parsedDeadline.getTime())) {
                return res.status(400).json({ error: 'Invalid deadline' });
            }

            updates.deadline = parsedDeadline;
        }

        // Update description if provided
        if (description) {
            if (typeof description !== 'string') {
                return res.status(400).json({ error: 'Invalid description' });
            }

            updates.description = description.trim();
        }

        // Ensure at least one field is being updated
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided' });
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        // Check assignment exists
        if (!updatedAssignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json(updatedAssignment);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// ================= SUBMISSIONS =================

// Get all submissions
router.get('/submissions', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // return all submissions to admin
        const submissions = await Submission.find();
        res.json(submissions);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Delete submission
router.delete('/submissions/:id', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // Id format validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const deleted = await Submission.findByIdAndDelete(req.params.id);

        // submission existence validation
        if (!deleted) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ message: 'Submission deleted' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


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