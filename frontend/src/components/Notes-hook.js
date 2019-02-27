import React, { useContext, useState, useEffect } from 'react'
import { Input, Button, Spin } from 'antd';
import AuthContext from '../contexts/auth-context';
import ReactQuill from 'react-quill'; // ES6
import { Code as CodeLoader } from 'react-content-loader'

import {
    Layout, Menu, Icon,
} from 'antd';

const { Content, Sider } = Layout;
const url = 'http://localhost:8000/graphql'

function NotePage() {
    const context = useContext(AuthContext)
    const [state, setState] = useState({
        currentNote: null,
        notes: [],
        editorLoading: true,
        listLoading: true
    })

    const changeTitle = e => {
        const title = e.target.value
        debugger
        const { currentNote } = state
        setState({
            currentNote: {
                ...currentNote,
                title
            }
        })
    }

    const changeText = (text) => {
        const { currentNote } = state
        setState({
            currentNote: {
                ...currentNote,
                text
            }
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
        });
        setState({
            notes: notesObj,
            currentNote: notes[0],
            listLoading: false,
            editorLoading: false
        })
    }

    const deleteNote = () => {
        const { currentNote } = state
        const requestBody = {
            query: `mutation
                {
                    deleteNote(_id: "${currentNote._id}", createdBy: "${context.userId}")
                }
            `
        }
        setState({
            editorLoading: true
        })
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Failed')
                }
                return res.json();
            })
            .then(resJson => {
                const { data: { deleteNote } } = resJson
                const { notes } = state
                const { [deleteNote]: deleted, ...rest } = notes
                const first = Object.keys(rest)[0] || null
                const newCurrentNote = rest[first]
                setState({
                    notes: rest,
                    currentNote: newCurrentNote,
                    editorLoading: false
                })
            })
            .catch(err => {
                console.error(err)
            })
    }

    const updateNote = () => {
        const { currentNote } = state
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
        setState({
            editorLoading: true
        })
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Failed')
                }
                return res.json();
            })
            .then(resJson => {
                const { data: { updateNote } } = resJson;
                setState({
                    currentNote: updateNote,
                    notes: {
                        ...state.notes,
                        [updateNote._id]: updateNote
                    },
                    editorLoading: false
                })
            })
            .catch(err => {
                console.error(err)
            })
    }

    const addNote = () => {
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
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Failed')
                }
                return res.json();
            })
            .then(resJson => {
                const { data: { createNote } } = resJson
                const { notes } = state
                notes[createNote._id] = createNote
                setState({
                    currentNote: createNote,
                    notes
                })
            })
            .catch(err => {
                console.error(err)
            })
    }

    const selectNote = ({ key }) => {
        const { notes } = state
        const currentNote = notes[key]
        setState({
            currentNote: currentNote
        })
    }

    const { notes, currentNote, editorLoading } = state
    const currentId = currentNote ? currentNote._id : null

    useEffect(()=>{getNotes()}, [])
    return (
        <>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider width={200} style={{ background: '#fff' }}>
                    <Menu
                        mode="inline"
                        selectedKeys={[currentId]}
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