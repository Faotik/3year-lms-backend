const express = require('express');
const router = express.Router();

const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const authMiddleware = require("../middlewares/auth");
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

// Get single assignment
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ error: 'Not found' });
        }

        res.json(assignment);
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// Create assignment
router.post('/', authMiddleware([ROLES.TEACHER]), async (req, res) => {
    try {
        // Create Assignment entity
        // Fix: whitelist fields
        const { title, description, courseId, deadline } = req.body;

        if (!title || !courseId || !deadline) {
            return res.status(400).json({ error: 'Missing required fields.' });
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
        res.status(400).json({ error: 'Bad request' });
    }
});

// Update assignment (lecturer)
router.put('/:id', authMiddleware([ROLES.TEACHER]), async (req, res) => {
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
        console.log(err);
        res.status(400).json({ error: 'Bad request' });
    }
});

// Get all assignments
router.get('/', authMiddleware(), async (req, res) => {
    try {
        let assignments;

        if (req.user.role === ROLES.ADMIN) {
            assignments = await Assignment.find()

        } else if (req.user.role === ROLES.TEACHER) {
            assignments = await Assignment.find({ lecturerId: req.user.id });

        } else {
            // TODO temprorary allow all - later filter by enrolled courses
            assignments = await Assignment.find()

            //assignments = await Assignment.find({ courseId: { $in: req.user.courses } })
        }
        res.json(assignments)

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    }
})

// // Get assignments by course
// router.get('/course/:id', AuthMiddleware, async (req, res) => {
//     try {
//         if
//         const assignments = await Assignment.find({ courseId: req.params.courseId });

//         res.json(assignments);

//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// Delete assignment
router.delete('/assignments/:id', authMiddleware(), async (req, res) => {
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

/**
 * Submissions endpoints breakdown:
     * * Allowed to Student:
         - POST: Attach submissions to specific assignment targeted by id
         - PUT: Update submission attached to assignment
         - GET:':id/submissions/me' -> Get student personal submission
     * * Allowed to Lecturer:
        - GET:'/:id/submissions' -> Get specific Assignment via ID
 **/


// Get all submission
router.get('/:id/submissions/', authMiddleware(), async (req, res) => {
    try {
        if (req.user.role === ROLES.ADMIN) {
            const assignment = await Assignment.findById(req.params.id);

            if (!assignment || assignment.lectureId.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Retrieve all submissions from specific Assignments
            const submissions = await Submission.find({
                assignmentId: req.params.id
            });

            // Return JSON of all submissions
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

            if (!assignment || assignment.lectureId.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
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
        console.log(err);
        res.status(400).json({ error: 'Bad request' });
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
        console.log(err);

        if (err.conde === 11000) {
            return res.status(400).json({ error: 'Already submitted' });
        }
        res.status(400).json({ error: 'Bad request' });
    }
});

// Update submission (student)
router.put('/:id/submissions', authMiddleware(), async (req, res) => {
    try {
        // Validate role permissions
        if (req.user.role !== ROLES.STUDENT) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const content = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content required' });
        }

        // Create new object from module with specific id
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
        console.log(err);
        res.status(400).json({ error: 'Bad request' });
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
        res.status(400).json({ error: 'Bad request' });
    }
});

module.exports = router;