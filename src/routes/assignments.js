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
        // Fix: whitelist fields
        const { title, description, courseId, deadline } = req.body;

        if (!title || !courseId || !deadline) {
            return res.status(400).json({error: 'Missing required fields.'});
        }

        const assignment = await Assignment.create({
            title,
            description,
            courseId,
            deadline,
            lecturerId: req.user.id
        });

        res.status(201).json(assignment);

    } catch (err) {
        // Iternal log
        console.log(err);
        res.status(400).json({error: 'Bad request'});
    }
});

// Update assignment (lecturer)
router.put('/:id', AuthMiddleware,async (req, res) => {
    try{
        // User role validation
        if (req.user.role !== ROLES.TEACHER) {
            return res.status(403).json({error: 'Access Forbidden. You are not authorized to access this page.'});
        }

        // White list fields
        const { title, description, deadline } = req.body;

        // Get specific assignment -> update its body
        const updated = await Assignment.findOneAndUpdate(
            {_id: req.params.id, lecturerId: req.user.id},
            {title, description, deadline},
            {new: true}
        );

        // Validation
        if (!updated) {
            return res.status(404).json({ error: 'Not found or not owner' });
        }

        res.json(updated);
    } catch (err) {
        console.log(err);
        res.status(400).json({error: 'Bad request'});
    }
});

// Get all available assignments without any filter
router.get('/', AuthMiddleware, async (req, res) => {
    try {
        let assignments;

        if (req.user.role !== ROLES.ADMIN) {
            assignments = await Assignment.find()
        }

        if (req.user.role !== ROLES.TEACHER) {
            assignments = await Assignment.find({ lecturerId: req.user.id });
        } else {
            // TODO temprorary allow all - later filter by enrolled courses
            assignments = await Assignment.find()
        }
        res.json(assignments)

    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Server error'});
    }
})

// Get assignments by course
router.get('/course/:courseId', AuthMiddleware, async (req, res) => {
    try {
        const assignments = await Assignment.find({courseId: req.params.courseId});

        res.json(assignments);

    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Server error'});
    }
});

// TODO
// Get single assignment
router.get('/:id', AuthMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({error: 'Not found'});
        }

        res.json(assignment);
    } catch (err) {
        console.log(err);
        res.status(400).json({error: 'Invalid ID'});
    }
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

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({error: 'Content required'});
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
            content
        });

        // Return newly created object to user
        res.status(201).json(submission);

    } catch (err) { // Catch any error
        console.log(err);

        if (err.conde === 11000){
            return res.status(400).json({error: 'Already submitted'});
        }
        res.status(400).json({error: 'Bad request'});
    }
});

// Update submission (student)
router.put('/:id/submissions',AuthMiddleware, async (req, res) => {
    try{

        // Validate role permissions
        if (req.user.role !== ROLES.STUDENT) {
            return res.status(403).json({error: 'Forbidden'});
        }

        const content = req.body;

        if (!content) {
            return res.status(400).json({error: 'Content required'});
        }

        // Create new object from module with specific id
        const assignment = await Assignment.findById(req.params.id);

        // Null object validation
        if (!assignment) {
            return res.status(404).json({error: 'Assignment not found'});
        }

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
            {content},
            {new: true}
        );

        if (!updated) {
            return res.status(404).json({error: 'Submission not found'});
        }

        // Return updated object
        res.json(updated);
    } catch (err) {
        console.log(err);
        res.status(400).json({error: 'Bad request'});
    }
});

// Get my submission (student)
router.get('/:id/submissions/me', AuthMiddleware, async (req, res) => {
    try{
        const submission = await Submission.findOne({
            assignmentId: req.params.id,
            studentId: req.user.id
        });

        res.json(submission);
    } catch (err) {
        console.log(err);
        res.status(400).json({error: 'Bad request'});
    }
});


// Get all submissions (lecturer)
router.get('/:id/submissions', AuthMiddleware, async (req, res) => {
    try {
        // Validate role permissions
        if (req.user.role !== ROLES.TEACHER) {
            return res.status(403).json({error: 'Forbidden'});
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment || assignment.lectureId.toString() !== req.user.id) {
            return res.status(403).json({error: 'Forbidden'});
        }

        // Retrieve all submissions from specific Assignments
        const submissions = await Submission.find({
            assignmentId: req.params.id
        });

        // Return JSON of all submissions
        res.json(submissions);

    } catch (err) {
        console.log(err);
        res.status(400).json({error: 'Bad request'});
    }
});


module.exports = router;