import React, { useContext, useState, useEffect } from 'react'
import { Input, Button, Spin } from 'antd';
import AuthContext from '../contexts/auth-context';
import ReactQuill from 'react-quill'; // ES6
import { Code as CodeLoader } from 'react-content-loader'

import {
    Layout, Menu, Icon,
} from 'antd';
import { stat } from 'fs';

const { Content, Sider } = Layout;
const url = 'http://localhost:8000/graphql'

function NotePage() {
    const context = useContext(AuthContext)
    const [notes, setNotes] = useState({})
    const [currentNote, setCurrentNote] = useState({})
    const [notesLoading, setNotesLoading] = useState(true)
    const [editorLoading, setEditorLoading] = useState(true)
    
    const changeTitle = e => {
        const title = e.target.value
        setCurrentNote({
            ...currentNote,
            title
        })
    }

    const changeText = (text) => {
        setCurrentNote({
            ...currentNote,
            text
        })
    }

    const getNotes = async () => {
        const requestBody = {
            query: `
            {
                notes(userId: "${context.userId}") {
                  title
                  text
                  modified
                  _id
                }
              }
            `
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const data = await response.json()
        const { data: { notes } } = data;
        const notesObj = {}
        notes.forEach(e => {
            notesObj[e._id] = e
        })

        setCurrentNote(notes[0])
        setNotes(notesObj)
        setEditorLoading(false)
    }

    const deleteNote = async () => {
        const requestBody = {
            query: `mutation
                {
                    deleteNote(_id: "${currentNote._id}", createdBy: "${context.userId}")
                }
            `
        }

        setNotesLoading(true)
        setEditorLoading(true)

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await response.json()
        const { data: { deleteNote } } = resJson
        const { [deleteNote]: deleted, ...rest } = notes
        const first = Object.keys(rest)[0] || null
        const newCurrentNote = rest[first]
        
        setCurrentNote(newCurrentNote)
        setNotes(rest)
        setNotesLoading(false)
        setEditorLoading(false)
    }

    const updateNote = async () => {
        const requestBody = {
            query: `mutation
                {
                    updateNote(noteInput: {title: "${currentNote.title}", text: "${currentNote.text}", _id: "${currentNote._id}", createdBy: "${context.userId}"}) {
                        title
                        text
                        _id
                    }
                }
            `
        }

        setEditorLoading(true)
        
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })

        const resJson = await response.json()
        const { data: { updateNote } } = resJson;
        
        setCurrentNote(updateNote)
        setNotes({
            ...notes,
            [updateNote._id]: updateNote
        })
        setEditorLoading(false)
    }

    const addNote = async () => {
        const requestBody = {
            query: `mutation
                {
                    createNote(noteInput: {title: "", text: "", createdBy: "${context.userId}"}) {
                        title
                        text
                        _id
                    }
                }
            `
        }
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await response.json()
        const { data: { createNote } } = resJson
        notes[createNote._id] = createNote
        setCurrentNote(createNote)
        setNotes({
            ...notes,
            [createNote._id]: createNote
        })
    }

    const selectNote = ({ key }) => {
        console.log(currentNote)
        setCurrentNote(notes[key])
        console.log(currentNote)
    }

    const currentId = currentNote ? currentNote._id : null

    useEffect(()=>{getNotes()}, [currentNote])
    return (
        <>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider width={200} style={{ background: '#fff' }}>
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[currentNote._id]}
                        style={{ height: '100%', borderRight: 0 }}
                    >
                        <Menu.Item style={{ color: 'red' }} onClick={context.logout}>
                            <Icon type="logout" /> Log out
                        </Menu.Item>
                        {Object.keys(notes).length > 0 &&
                            Object.keys(notes).map(_id =>
                                <Menu.Item onClick={selectNote} key={_id}>
                                    <Icon type="file-text" /> <strong>{notes[_id].title || 'Untitled'}</strong>
                                </Menu.Item>)
                        }
                        <Menu.Item onClick={addNote}>
                            <Icon type="plus-circle" /> New note
                        </Menu.Item>
                    </Menu>
                    {notes === null &&
                        <div className="loading-container">
                            <Spin />
                        </div>
                    }
                </Sider>
                <Layout style={{ padding: '20px' }}>
                    <Content style={{
                        background: '#fff', padding: 24, margin: 0, minHeight: 280,
                    }}
                    >
                        {editorLoading === true &&
                            <CodeLoader />
                        }
                        {editorLoading === false && currentNote &&
                            <>
                                <div style={{ float: 'right' }}>
                                    <Button type="danger" style={{ marginRight: '5px' }} onClick={deleteNote}>Delete</Button>
                                    <Button type="default" onClick={updateNote}>Save</Button>
                                </div>
                                <Input size="large" className="note-title" placeholder="Title" value={currentNote.title} onChange={changeTitle} />
                                <ReactQuill theme="snow" value={currentNote.text} onChange={changeText} placeholder="Start writting your note here." />
                            </>}
                    </Content>
                </Layout>
            </Layout>
        </>
    )
}


export default NotePage;