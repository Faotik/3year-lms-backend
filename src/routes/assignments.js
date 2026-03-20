const express = require('express');
const router = express.Router();

const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const AuthMiddleware = require("../middlewares/auth");
const ROLES = require('../constants/roles');

// ============ ASSIGNMENTS ============
/**
 * Assignments endpoints breakdown:
     - POST: Create assignment, only for lecturer
     - PUT: Update created assignment addressing specific assignment with the id
     - GET:'/' -> Receive all assignments that been stored in DB
     - GET:'/:id' -> Get specific Assignment via ID
     - GET:'/course/:courseId' -> Get assignments that linked to specific course
 **/
// Create assignment (lecturer)
router.post('/', AuthMiddleware, async (req, res) => {
    try {
        // User role validation
        if (req.user.role !== ROLES.TEACHER) {
            return res.status(403).json({error: 'Access Forbidden. You are not authorized to access this page.'});
        }

        // Create Assignment entity
        const assignment = await Assignment.create({
            ...req.body,
            lecturerId: req.user.id
        });

        res.status(201).json(assignment);

    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

// Update assignment (lecturer)
router.put('/:id', AuthMiddleware,async (req, res) => {

    // User role validation
    if (req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({error: 'Access Forbidden. You are not authorized to access this page.'});
    }

    // Get specific assignment -> update its body
    const updated = await Assignment.findOneAndUpdate(
        {_id: req.params.id, lecturerId: req.user.id},
        req.body,
        {new: true}
    );

    // Validation
    if (!updated) {
        return res.status(404).json({ error: 'Not found or not owner' });
    }

    res.json(updated);
});

// Get all available assignments without any filter
router.get('/', AuthMiddleware, async (req, res) => {
    const list = await Assignment.find();
    res.json(list)
})

// Get assignments by course
router.get('/course/:courseId', AuthMiddleware, async (req, res) => {
    const list = await Assignment.find({courseId: req.params.courseId});

    if (!list) {
        return res.status(404).json({error: 'Not Found'});
    }

    res.json(list);
});

// Get single assignment
router.get('/:id', AuthMiddleware, async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        return res.status(404).json({error: 'Not found'});
    }

    res.json(assignment);
});



// ================= SUBMISSIONS =================

/**
 * Submissions endpoints breakdown:
     * * Allowed to Student:
         - POST: Attach submissions to specific assignment targeted by id
         - PUT: Update submission attached to assignment
         - GET:':id/submissions/me' -> Get student personal submission
     * * Allowed to Lecturer:
        - GET:'/:id/submissions' -> Get specific Assignment via ID
 **/

// Submit assignment (student)
router.post('/:id/submissions',AuthMiddleware, async (req, res) => {
    try {
        // Role validation
        if (req.user.role !== ROLES.STUDENT) {
            return res.status(403).json({error: 'Forbidden'});
        }

        // Get targeted Assignment module
        const assignment = await Assignment.findById(req.params.id);

        // Validate if "GET" method succeeded
        if (!assignment) {
            return res.status(404).json({error: 'Assignment not found'});
        }

        // Validate if submissions happens before deadline
        if (new Date() > assignment.deadline) {
            return res.status(400).json({error: 'Deadline passed'});
        }

        // If all checks pass -> Create new object
        const submission = await Submission.create({
            assignmentId: req.params.id,
            studentId: req.user.id,
            content: req.body.content
        });

        // Return newly created object to user
        res.status(201).json(submission);

    } catch (err) { // Catch any error
        res.status(400).json({error: err.message});
    }
});

// Update submission (student)
router.put('/:id/submissions',AuthMiddleware, async (req, res) => {

    // Validate role permissions
    if (req.user.role !== ROLES.STUDENT) {
        return res.status(403).json({error: 'Forbidden'});
    }

    // Create new object from module with specific id
    const assignment = await Assignment.findById(req.params.id);

    // Validate deadline submission
    if (new Date() > assignment.deadline) {
        return res.status(400).json({error: 'Deadline passed'});
    }

    // Gather updated entity data
    const updated = await Submission.findOneAndUpdate(
        {
            assignmentId: req.params.id,
            studentId: req.user.id
        },
        {content: req.body.content},
        {new: true}
    );

    // Return updated object
    res.json(updated);
});

// Get my submission (student)
router.get('/:id/submissions/me', AuthMiddleware, async (req, res) => {
    const submission = await Submission.findOne({
        assignmentId: req.params.id,
        studentId: req.user.id
    });

    res.json(submission);
});


// Get all submissions (lecturer)
router.get('/:id/submissions', AuthMiddleware, async (req, res) => {

    // Validate role permissions
    if (req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({error: 'Forbidden'});
    }

    // Retrieve all submissions from specif Assignments
    const submissions = await Submission.find({
        assignmentId: req.params.id
    });

    // Return JSON of all submissions
    res.json(submissions);
});


module.exports = router;