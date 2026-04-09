const mongoose = require('mongoose')

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    sections: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section'
        }
    ],
    description: {
        type: String
    }
})


module.exports = mongoose.model('Module', moduleSchema)