const Note = require('../../models/note')
const Version = require('../../models/version')
const User = require('../../models/user')
const objectID = require('mongodb').ObjectID

const noteResolver = {
    notes: async (args) => {
        try {
            const {userId} = args
            const notes = await Note.find({
                createdBy: userId
            })
            const user = await User.findById(userId)
            const sharedNoteIds = user.sharedNotes.map(e => new objectID(e))
            const sharedNotes = await Note.find({
                _id: {
                    $in: sharedNoteIds
                }
            })
            const result = notes.concat(sharedNotes)
            return result
        } catch (error) {
            throw error
        }
    },
    versions: async (args) => {
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
    shareNote : async (args) => {
        const {noteInput} = args
        const note = await Note.findById(noteInput._id)

        const userEmailToAdd = noteInput.sharedUsers.filter(i => !note.sharedUsers.includes(i))[0]
        const userToAdd = await User.findOne({email: userEmailToAdd})
        if (userToAdd) {
            if (!userToAdd.sharedNotes.includes(noteInput._id)) {
                userToAdd.sharedNotes.push(noteInput._id)
            }
            await userToAdd.save()
        }

        const userEmailToRemove = note.sharedUsers.filter(i => !noteInput.sharedUsers.includes(i))[0]
        const userToRemove = await User.findOne({email: userEmailToRemove})
        if (userToRemove) {
            userToRemove.sharedNotes = userToRemove.sharedNotes.filter(n => n !== noteInput._id)
            await userToRemove.save()
        }

        note.sharedUsers = noteInput.sharedUsers
        await note.save()
        return note
    },
    createNote: async (args) => {
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
    updateNote: async(args) => {
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
    deleteNote: async (args) => {
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