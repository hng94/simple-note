const Note = require('../../models/note')
const User = require('../../models/user')
const mongoose = require('mongoose')

const mapToDTO = note => {
    return {
        ...note._doc,
        _id: note.id
    }
}

const noteResolver = {
    notes: async (args, req) => {
        try {
            const userId = args.userId
            const notes = await Note.find({
                'createdBy': userId
            })
            console.log(notes)
            return notes
        } catch (error) {
            throw error
        }
    },
    createNote: async (args, req) => {
        const {noteInput} = args
        const note = new Note({
            title: noteInput.title,
            text: noteInput.text,
            createdBy: noteInput.createdBy,
            created: new Date(),
            modified: new Date()
        })

        let createdNote;
        try {
            const result = note.save()
            console.log(result)
            return result
        } catch (error) {
            throw error
        }
    },
    updateNote: async(args, req) => {
        const {noteInput} = args

        try {
            const note = await Note.findById(noteInput._id)
            note.title = noteInput.title
            note.text = noteInput.text
            note.modified = new Date()
            note.save()
            return note
        } catch (error) {
            throw error
        }
    },
    deleteNote: async (args, req) => {
        const {_id, createdBy} = args
        try {
            const note = await Note.findOneAndRemove({
                _id,
                createdBy
            })
            if (!note) {
                throw new Error("Not found")
            }
            return _id;
        } catch (error) {
            throw error
        }
    }
}

module.exports = noteResolver;