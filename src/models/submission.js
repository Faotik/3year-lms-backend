const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {timestamps: true});

// Only one submission per student per assignment
submissionSchema.index({assignmentId: 1, studentId: 1}, {unique: true});

module.exports = mongoose.model('Submission', submissionSchema);