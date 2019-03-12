const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const noteSchema = new Schema({
    text: {
        type: String,
    },
    title: {
        type: String,
    },
    modified: {
        type: Date,
        required: true
    },
    created: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    sharedUsers: {
        type: [String]
    }
})

module.exports = mongoose.model('Note', noteSchema)