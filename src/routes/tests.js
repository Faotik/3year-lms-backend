const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Test = require('../models/classTest');
const TestSubmission = require('../models/testSubmission');
const Module = require('../models/module');
const authMiddleware = require("../middlewares/auth");
const ROLES = require('../constants/roles');
const submission = require('../models/submission');

// ============ Tests ============
// Get all tests
router.get('/', authMiddleware(), async (req, res) => {
    try {
        let tests;

        if (req.user.role === ROLES.ADMIN) {
            tests = await Test.find();
        } else {
            const moduleIds = await Module.find({
                users: req.user.id
            }).distinct('_id');
            if (req.user.role === ROLES.STUDENT) {
                tests = await Test.find({
                    moduleId: { $in: moduleIds }
                }).select('-questions.correctAnswer');
            } else {
                tests = await Test.find({
                    moduleId: { $in: moduleIds }
                });
            }
        }

        res.json(tests);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Get single test
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Test not found' });
        }

        let test;

        if (req.user.role === ROLES.STUDENT) {
            test = await Test.findById(req.params.id).select('-questions.correctAnswer');
        } else {
            test = await Test.findById(req.params.id);
        }

        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const module = await Module.findById(test.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        res.json(test);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create test
router.post('/', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        const { title, description, moduleId, deadline, questions } = req.body;

        if (!title || !moduleId || !deadline || !questions) {
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

        const test = await Test.create({
            title,
            description,
            moduleId,
            deadline,
            questions
        });

        res.status(201).json(test);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Update test (lecturer)
router.put('/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Test not found' });
        }

        if (req.user.role !== ROLES.ADMIN) {
            const moduleIds = await Module.find({
                users: req.user.id
            }).distinct('_id');
            const test = await Test.findOne({
                _id: req.params.id,
                moduleId: { $in: moduleIds }
            });
            if (!test) {
                return res.status(404).json({ error: 'Test not found' });
            }
        }

        const { title, deadline, description, questions } = req.body;

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

        // Update description if provided
        if (questions) {
            if (!Array.isArray(questions)) {
                return res.status(400).json({ error: 'Invalid questions' });
            }

            updates.questions = questions;
        }

        // Ensure at least one field is being updated
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided' });
        }

        const updatedTest = await Test.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        // Check test exists
        if (!updatedTest) {
            return res.status(404).json({ error: 'Test not found' });
        }

        res.json(updatedTest);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete test
router.delete('/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const module = await Module.findById(test.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }
        await test.deleteOne();
        await TestSubmission.deleteMany({ testId: req.params.id });

        return res.json({ message: 'Test deleted' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ================= SUBMISSIONS =================

// Get all submission
router.get('/:id/submissions/', authMiddleware(), async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        let submissions = [];

        if (req.user.role === ROLES.ADMIN) {
            submissions = await TestSubmission.find({
                testId: req.params.id
            }).populate('studentId', 'name');
        }
        else if (req.user.role === ROLES.STUDENT) {
            const studentSubmission = await TestSubmission.findOne({
                testId: req.params.id,
                studentId: req.user.id
            });
            submissions = studentSubmission ? [studentSubmission] : [];

        } else if (req.user.role === ROLES.TEACHER) {
            const module = await Module.findById(test.moduleId);
            if (!module || !module.users.some(id => id.equals(req.user.id))) {
                return res.status(403).json({ message: "Access forbidden" });
            }

            submissions = await TestSubmission.find({
                testId: req.params.id
            }).populate('studentId', 'name');
        }
        else {
            return res.status(403).json({ error: 'Access forbidden' });
        }

        const result = [];
        for (const submission of submissions) {
            let score = 0;
            let maxScore = 0;

            for (const answer of submission.answers || []) {
                const question = test.questions?.[answer.questionNumber];
                if (!question) {
                    continue;
                }

                const marks = Number(question.marks) || 0;
                maxScore += marks;

                if (question.correctAnswer !== undefined && question.correctAnswer === answer.answer) {
                    score += marks;
                }
            }
            result.push({
                ...submission.toObject(),
                score,
                maxScore
            });
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Submit test (student)
router.post('/:id/submissions', authMiddleware([ROLES.STUDENT]), async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers) {
            return res.status(400).json({ error: 'Answers required' });
        }

        // Get targeted Test
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const module = await Module.findById(test.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        // Validate if submissions happens before deadline
        if (new Date() > test.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        // If all checks pass -> Create new object
        const submission = await TestSubmission.create({
            testId: req.params.id,
            studentId: req.user.id,
            answers
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
router.put('/:id/submissions', authMiddleware([ROLES.STUDENT]), async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers) {
            return res.status(400).json({ error: 'Answers required' });
        }

        // Get targeted Test
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const module = await Module.findById(test.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        // Validate deadline submission
        if (new Date() > test.deadline) {
            return res.status(400).json({ error: 'Deadline passed' });
        }

        // Gather updated entity data
        const updated = await TestSubmission.findOneAndUpdate(
            {
                testId: req.params.id,
                studentId: req.user.id
            },
            { answers },
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
router.delete('/:id/submissions', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Id format validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        // Get targeted Test
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const module = await Module.findById(test.moduleId);
        if (!module.users.some(id => id.equals(req.user.id)) && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const deleted = await TestSubmission.findOneAndDelete({
            assignmentId: req.params.id,
            studentId: req.user.id
        });

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
