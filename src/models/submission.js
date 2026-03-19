const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {type: mongoose.Schema.Types.ObjectId, required: true},
    studentId: {type: mongoose.Schema.Types.ObjectId, required: true},
    content: {type: String, required: true}
}, {timestamps: true});

// prevent duplicate submissions
submissionSchema.index({assignmentId: 1, studentId: 1}, {unique: true});

module.exports = mongoose.model('Submission', submissionSchema);