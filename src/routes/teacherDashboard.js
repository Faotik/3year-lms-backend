const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Assignment = require('../models/assignment');
const Submission = require('../models/submission');

const AuthMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');


// Teacher rights validation
const requireTeacher = (req, res, next) => {
    if (req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({
            error: 'Teacher only access'
        });
    }
    next();
};


// Create assignment  <from assignemnts.js>
router.post('/', AuthMiddleware, requireTeacher, async (req, res) => {
    try {
        const { title, description, courseId, deadline } = req.body;

        if (!title || !courseId || !deadline) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const parsedDeadline = new Date(deadline);

        if (isNaN(parsedDeadline.getTime())) {
            return res.status(400).json({
                error: 'Invalid deadline'
            });
        }

        const assignment = await Assignment.create({
            title: title.trim(),
            description: description?.trim(),
            courseId,
            deadline: parsedDeadline,
            lecturerId: req.user.id
        });

        res.status(201).json(assignment);

    } catch (err) {
        console.error(err);
        res.status(400).json({
            error: 'Bad request'
        });
    }
});


// Update assignment <from assignemnts.js>
router.put('/:id', AuthMiddleware, requireTeacher, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid assignment ID'
            });
        }

        const { title, description, deadline } = req.body;

        const updates = {};

        if (title) {
            updates.title = title.trim();
        }

        if (description) {
            updates.description = description.trim();
        }

        if (deadline) {
            const parsedDeadline = new Date(deadline);

            if (isNaN(parsedDeadline.getTime())) {
                return res.status(400).json({
                    error: 'Invalid deadline'
                });
            }

            updates.deadline = parsedDeadline;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'No valid fields provided'
            });
        }
        // update only if owned by teacher
        const updated = await Assignment.findOneAndUpdate(
            {
                _id: req.params.id,
                lecturerId: req.user.id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            return res.status(404).json({
                error: 'Assignment not found or not owner'
            });
        }

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(400).json({
            error: 'Bad request'
        });
    }
});


// Delete assignment
router.delete('/:id', AuthMiddleware, requireTeacher, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid assignment ID'
            });
        }

        // Delete only if owned by teacher
        const deleted = await Assignment.findOneAndDelete({
            _id: req.params.id,
            lecturerId: req.user.id
        });

        if (!deleted) {
            return res.status(404).json({
                error: 'Assignment not found or not owner'
            });
        }

        await Submission.deleteMany({
            assignmentId: req.params.id
        });

        res.json({
            message: 'Assignment deleted successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            error: 'Bad request'
        });
    }
});


// Get assignments created by lecture
router.get('/', AuthMiddleware, requireTeacher,async (req, res) => {
    try {
        const assignments = await Assignment.find({
            lecturerId: req.user.id
        });

        res.json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Server error'
        });
    }
});


// Get specific assignment by id <from assignmetns.js>
router.get('/:id', AuthMiddleware, requireTeacher, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid assignment ID'
            });
        }

        // get only owned assignments
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            lecturerId: req.user.id
        });

        if (!assignment) {
            return res.status(404).json({
                error: 'Assignment not found or not owner'
            });
        }

        res.json(assignment);

    } catch (err) {
        console.error(err);
        res.status(400).json({
            error: 'Bad request'
        });
    }
});

// ============ TESTS ============

// TODO Create test
// TODO Update test that only specific lecture created
// TODO Delete test that only specific lecture created

module.exports = router;