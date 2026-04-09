const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Assignment = require('../models/assignment');
const Submission = require('../models/submission');

const AuthMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');


// Student guard
const requireStudent = (req, res, next) => {
    if (req.user.role !== ROLES.STUDENT) {
        return res.status(403).json({ error: 'Students only' });
    }
    next();
};


// ================= ASSIGNMENTS =================

// Get assignments that are available to student
router.get('/assignments', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        // TODO: later filter by enrolled modules
        const assignments = await Assignment.find();
        //  const assignments = await Assignment.find({ courseId: { $in: studentCourses } })

        res.json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Get single assignment
router.get('/assignments/:id', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const assignment = await Assignment.findById(req.params.id);

        // Ensure assignment exists
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json(assignment);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// ================= SUBMISSIONS =================

// Submit assignment
router.post('/assignments/:id/submissions', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const { content } = req.body;

        // Validate content
        if (!content) {
            return res.status(400).json({ error: 'Content required' });
        }

        const assignment = await Assignment.findById(req.params.id);

        // Ensure assignment exists
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check deadline
        if (new Date() > assignment.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        // Prevent duplicate submission (race condition mitigation)
        const existing = await Submission.findOne({
            assignmentId: req.params.id,
            studentId: req.user.id
        });

        if (existing) {
            return res.status(400).json({ error: 'Already submitted' });
        }

        const submission = await Submission.create({
            assignmentId: req.params.id,
            studentId: req.user.id,
            content: content.trim()
        });

        res.status(201).json(submission);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// Update submission
router.put('/assignments/:id/submissions', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content required' });
        }

        const assignment = await Assignment.findById(req.params.id);

        // Ensure assignment exists
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Check deadline
        if (new Date() > assignment.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        const updated = await Submission.findOneAndUpdate(
            {
                assignmentId: req.params.id,
                studentId: req.user.id
            },
            { content },
            { new: true }
        );

        // Ensure submission exists
        if (!updated) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// Get my submission
router.get('/assignments/:id/submissions/me', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const submission = await Submission.findOne({
            assignmentId: req.params.id,
            studentId: req.user.id
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


// Get all my submissions
router.get('/submissions', AuthMiddleware, requireStudent, async (req, res) => {
    try {
        const submissions = await Submission.find({
            studentId: req.user.id
        });

        res.json(submissions);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// ================= MODULES =================

//TODO get all modules student enrolled

module.exports = router;