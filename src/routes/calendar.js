const express = require('express');
const router = express.Router();

const Assignment = require('../models/assignment');
const Module = require('../models/module');
const authMiddleware = require('../middlewares/auth');
const ROLES = require('../constants/roles');


// Helper function that transform assignment format into calendar event
const formatEvent = (assignment) => ({
    id: assignment._id,
    title: assignment.title,
    description: assignment.description,
    deadline: assignment.deadline,
    courseId: assignment.courseId
});

const getEnrolledModuleIds = async (userId) => {
    const modules = await Module.find({ users: userId }, '_id');
    return modules.map((m) => m._id);
};

// ================= All Events =================
router.get('/', authMiddleware(), async (req, res) => {
    try {
        // Ensure user exists
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let assignments;

        if (req.user.role === ROLES.STUDENT) {
            const moduleIds = await getEnrolledModuleIds(req.user.id);
            assignments = await Assignment.find(
                { moduleId: { $in: moduleIds } },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.TEACHER) {
            assignments = await Assignment.find(
                { lecturerId: req.user.id },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.ADMIN) {
            assignments = await Assignment.find({}, 'title description deadline courseId');
        }

        // Fallback protection
        if (!assignments) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const events = assignments.map(formatEvent);

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// ================= Upcoming Events =================
router.get('/upcoming', authMiddleware(), async (req, res) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const now = new Date();

        let assignments;

        if (req.user.role === ROLES.STUDENT) {
            const moduleIds = await getEnrolledModuleIds(req.user.id);
            assignments = await Assignment.find(
                { moduleId: { $in: moduleIds }, deadline: { $gte: now } },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.TEACHER) {
            assignments = await Assignment.find(
                { lecturerId: req.user.id, deadline: { $gte: now } },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.ADMIN) {
            assignments = await Assignment.find(
                { deadline: { $gte: now } },
                'title description deadline courseId'
            );
        }

        if (!assignments) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const events = assignments.map(formatEvent);

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// ================= Events By Date =================
router.get('/:date', authMiddleware(), async (req, res) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const rawDate = req.params.date;

        // Validate date format
        if (!rawDate || isNaN(new Date(rawDate).getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const date = new Date(rawDate);

        // Create safe copies
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        let assignments;

        if (req.user.role === ROLES.STUDENT) {
            const moduleIds = await getEnrolledModuleIds(req.user.id);
            assignments = await Assignment.find(
                { moduleId: { $in: moduleIds }, deadline: { $gte: start, $lte: end } },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.TEACHER) {
            assignments = await Assignment.find(
                {
                    lecturerId: req.user.id,
                    deadline: { $gte: start, $lte: end }
                },
                'title description deadline courseId'
            );
        }
        else if (req.user.role === ROLES.ADMIN) {
            assignments = await Assignment.find(
                { deadline: { $gte: start, $lte: end } },
                'title description deadline courseId'
            );
        }

        if (!assignments) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const events = assignments.map(formatEvent);

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Bad request' });
    }
});


module.exports = router;
