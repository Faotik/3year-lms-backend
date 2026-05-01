const mongoose = require('mongoose')

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ]
})


module.exports = mongoose.model('Module', moduleSchema)
