const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: String,
            marks: Number
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);