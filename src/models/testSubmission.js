const mongoose = require('mongoose');

const testSubmissionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    answers: [
        {
            questionNumber: Number,
            answer: String
        }
    ],
}, { timestamps: true });

// Only one submission per student per test
testSubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', testSubmissionSchema);