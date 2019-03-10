const Note = require('../../models/note')
const Version = require('../../models/version')
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
            const {userId} = args
            const notes = await Note.find({
                createdBy: userId
            })
            return notes
        } catch (error) {
            throw error
        }
    },
    versions: async (args, req) => {
        try {
            const {noteId} = args
            const versions = await Version.find({
                noteId
            })
            return versions
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

        const firstVersion = new Version({
            title: note.title,
            text: note.text,
            created: note.created,
            noteId: note._id
        })

        try {
            const result = await note.save()
            await firstVersion.save()
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
            note.tags = noteInput.tags
            note.modified = new Date()
            await note.save()

            const newVersion = new Version({
                title: note.title,
                text: note.text,
                created: note.modified,
                noteId: note._id
            })
            await newVersion.save()

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

            const deleteVersions = await Version.deleteMany({
                noteId: _id
            })
            return _id;
        } catch (error) {
            throw error
        }
    }
}

module.exports = noteResolver;