const mongoose = require('mongoose')

const moduleSchema = new mongoose.Schema({
    name: {
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


module.exports = mongoose.model('User', userSchema)