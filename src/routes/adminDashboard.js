const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/user');
const Assignment = require('../models/assignment');
const Submission = require('../models/submission');

const AuthMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');


// Admin rights validation
const requireAdmin = (req, res, next) => {
    if (req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
};


// =========== USERS ===========

// Get all users
router.get('/users', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // Restrict 'password' and 'token' fields in response
        const users = await User.find().select('-password -refreshTokens');
        res.json(users);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Update user role
router.put('/users/:id/role', AuthMiddleware, requireAdmin, async (req, res) => {
    try {

        // User id validaton
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const { role } = req.body;

        // Check role existence and validness
        if (!role || !Object.values(ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Own role manipulation validation
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -refreshTokens'); // Restrict 'password' and 'token' fields in response

        // User existence validation
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// Delete user
router.delete('/users/:id', AuthMiddleware, requireAdmin, async (req, res) => {
    try {
        // Id format validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        // Prevent admin to delete himself
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'You cannot delete yourself' });
        }

        const user = await User.findById(req.params.id);

        // Check user existence
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting last admin in system
        const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
        if (adminCount === 1 && user.role === ROLES.ADMIN) {
            return res.status(400).json({ error: 'Cannot delete last admin' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


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


module.exports = router;