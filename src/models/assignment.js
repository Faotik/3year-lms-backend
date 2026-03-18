const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: String,
    courseId: {type: mongoose.Schema.Types.ObjectId, required: true},
    lecturerId: {type: mongoose.Schema.Types.ObjectId, required: true},
    deadline: {type: Date, required: true}
}, {timestamps: true});

module.exports = mongoose.model('Assignment', assignmentSchema);