const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const versionSchema = new Schema({
    text: {
        type: String,
    },
    title: {
        type: String,
    },
    created: {
        type: Date,
        required: true
    },
    noteId: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Version', versionSchema)