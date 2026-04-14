const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const Module = require('../models/module');
const authMiddleware = require("../middlewares/auth");
const ROLES = require('../constants/roles');

// ============ ASSIGNMENTS ============
// Get all assignments
router.get('/', authMiddleware(), async (req, res) => {
    try {
        let assignments;

        if (req.user.role === ROLES.ADMIN) {
            assignments = await Assignment.find();
        } else {
            const moduleIds = await Module.find({
                users: req.user.id
            }).distinct('_id');
            assignments = await Assignment.find({
                moduleId: { $in: moduleIds }
            });
        }
        res.json(assignments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

//
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json(assignment);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create assignment
router.post('/', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Create Assignment entity
        // Fix: whitelist fields
        const { title, description, moduleId, deadline } = req.body;

        if (!title || !moduleId || !deadline) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: 'Module not found' });
        }
        const module = await Module.findById(moduleId);
        if (!module) {
            return res.status(400).json({ error: 'Module not found.' });
        }
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const assignment = await Assignment.create({
            title,
            description,
            moduleId,
            deadline,
            lecturerId: req.user.id
        });

        res.status(201).json(assignment);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update assignment (lecturer)
router.put('/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        if (req.user.role !== ROLES.ADMIN) {
            const moduleIds = await Module.find({
                users: req.user.id
            }).distinct('_id');
            const assignment = await Assignment.findOne({
                _id: req.params.id,
                moduleId: { $in: moduleIds }
            });
            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }
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
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete assignment
router.delete('/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const assignment = await Assignment.findOne({
            _id: req.params.id
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const module = await Module.findById(assignment.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }
        await assignment.deleteOne();
        await Submission.deleteMany({ assignmentId: req.params.id });

        return res.json({ message: 'Assignment deleted' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ================= SUBMISSIONS =================



// Get all submission
router.get('/:id/submissions/', authMiddleware(), async (req, res) => {
    try {
        if (req.user.role === ROLES.ADMIN) {
            const assignment = await Assignment.findById(req.params.id);

            if (!assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            const submissions = await Submission.find({
                assignmentId: req.params.id
            });

            res.json(submissions);
        }
        else if (req.user.role === ROLES.STUDENT) {
            const submission = await Submission.findOne({
                assignmentId: req.params.id,
                studentId: req.user.id
            });

            res.json(submission);

        } else if (req.user.role === ROLES.TEACHER) {
            const assignment = await Assignment.findById(req.params.id);

            const module = await Module.findById(assignment.moduleId);
            if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
                return res.status(403).json({ message: "Access forbidden" });
            }

            // Retrieve all submissions from specific Assignments
            const submissions = await Submission.find({
                assignmentId: req.params.id
            });

            // Return JSON of all submissions
            res.json(submissions);
        }
        else {
            return res.status(403).json({ error: 'Forbidden' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Submit assignment (student)
router.post('/:id/submissions', authMiddleware(), async (req, res) => {
    try {
        // Role validation
        if (req.user.role !== ROLES.STUDENT) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content required' });
        }

        // Get targeted Assignment module
        const assignment = await Assignment.findById(req.params.id);

        // Validate if "GET" method succeeded
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Validate if submissions happens before deadline
        if (new Date() > assignment.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        // If all checks pass -> Create new object
        const submission = await Submission.create({
            assignmentId: req.params.id,
            studentId: req.user.id,
            content
        });

        // Return newly created object to user
        res.status(201).json(submission);

    } catch (err) { // Catch any error
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Already submitted' });
        }

        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update submission (student)
router.put('/:id/submissions', authMiddleware(), async (req, res) => {
    try {
        // Validate role permissions
        if (req.user.role !== ROLES.STUDENT) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { content } = req.body;

        if (content === undefined || content === null || content === '') {
            return res.status(400).json({ error: 'Content required' });
        }
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Content must be a string' });
        }

        const assignment = await Assignment.findById(req.params.id);

        // Null object validation
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Validate deadline submission
        if (new Date() > assignment.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        // Gather updated entity data
        const updated = await Submission.findOneAndUpdate(
            {
                assignmentId: req.params.id,
                studentId: req.user.id
            },
            { content },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Return updated object
        res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete submission
router.delete('/submissions/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
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
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;