import React, { Component } from 'react'
import { Avatar, Input, Button, Spin } from 'antd';
import AuthContext from '../contexts/auth-context';
import ReactQuill from 'react-quill'; // ES6
import { List as ListLoader, Code as CodeLoader } from 'react-content-loader'

import {
    Layout, Menu, Breadcrumb, Icon,
} from 'antd';

const ButtonGroup = Button.Group;
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;
const url = 'http://localhost:8000/graphql'

class NotePage extends Component {
    static contextType = AuthContext;
    constructor(props) {
        super(props)
        this.state = {
            currentNote: null,
            notes: [],
            editorLoading: true,
            listLoading: true
        }
    }

    componentDidMount() {
        this.getNotes()
    }

    changeTitle = e => {
        const title = e.target.value;
        const {currentNote} = this.state
        this.setState({
            currentNote: {
                ...currentNote,
                title
            }
        })
    }

    changeText = (text) => {
        const {currentNote} = this.state
        this.setState({
            currentNote: {
                ...currentNote,
                text
            }
        })
    }

    getNotes = async () => {
        const requestBody = {
            query: `
            {
                notes(userId: "${this.context.userId}") {
                  title
                  text
                  modified
                  _id
                }
              }
            `
        }
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await res.json();
        const {data: {notes}} = resJson;
        const notesObj = {}
        notes.forEach(e => {
            notesObj[e._id] = e
        });
        this.setState({
            notes: notesObj,
            currentNote: notes[0],
            listLoading: false,
            editorLoading: false
        })
    }

    deleteNote = async () => {
        const {currentNote} = this.state
        const requestBody = {
            query: `mutation
                {
                    deleteNote(_id: "${currentNote._id}", createdBy: "${this.context.userId}")
                }
            `
        }
        this.setState({
            editorLoading: true
        })
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })

        const resJson = await res.json()
        const {data: {deleteNote}} = resJson
        const {notes} = this.state
        const {[deleteNote]: deleted, ...rest} = notes
        const first = Object.keys(rest)[0] || null
        const newCurrentNote = rest[first]
        this.setState({
            notes: rest,
            currentNote: newCurrentNote,
            editorLoading: false
        })
    }

    updateNote = async () => {
        const {currentNote} = this.state
        const requestBody = {
            query: `mutation
                {
                    updateNote(noteInput: {title: "${currentNote.title}", text: "${currentNote.text}", _id: "${currentNote._id}", createdBy: "${this.context.userId}"}) {
                        title
                        text
                        _id
                    }
                }
            `
        }
        this.setState({
            editorLoading: true
        })
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await res.json()
        const {data: {updateNote}} = resJson;
        this.setState({
            currentNote: updateNote,
            notes: {
                ...this.state.notes,
                [updateNote._id]: updateNote
            },
            editorLoading: false
        })
    }

    addNote = async () => {
        const requestBody = {
            query: `mutation
                {
                    createNote(noteInput: {title: "", text: "", createdBy: "${this.context.userId}"}) {
                        title
                        text
                        _id
                    }
                }
            `
        }
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await res.json() 
        const {data: {createNote}} = resJson
        const {notes} = this.state
        notes[createNote._id] = createNote
        this.setState({
            currentNote: createNote,
            notes
        })
    }

    selectNote = ({ item, key, keyPath }) => {
        const {notes} = this.state
        const currentNote = notes[key]
        this.setState({
            currentNote: currentNote
        })
    }

    render() {
        const {notes, currentNote, editorLoading} = this.state
        const currentId = currentNote? currentNote._id : null
        return (
            <>
                <Layout style={{minHeight: '100vh'}}>
                    <Sider width={200} style={{ background: '#fff' }}>
                        <Menu
                            mode="inline"
                            selectedKeys={[currentId]}
                            style={{ height: '100%', borderRight: 0 }}
                        >
                            <Menu.Item style={{color: 'red'}} onClick={this.context.logout}>
                                <Icon type="logout" /> Log out
                            </Menu.Item>
                            {Object.keys(notes).length > 0 && 
                            Object.keys(notes).map(_id => 
                                <Menu.Item onClick={this.selectNote} key={_id}>
                                    <Icon type="file-text" /> <strong>{notes[_id].title || 'Untitled'}</strong>
                                </Menu.Item>)
                            }
                            <Menu.Item onClick={this.addNote}>
                                <Icon type="plus-circle" /> New note
                            </Menu.Item>
                        </Menu>
                        {notes === null &&
                        <div className="loading-container">
                            <Spin/>
                        </div>
                        }
                    </Sider>
                    <Layout style={{ padding: '20px' }}>
                        <Content style={{
                            background: '#fff', padding: 24, margin: 0, minHeight: 280,
                        }}
                        >
                            {editorLoading === true && 
                            <CodeLoader/>
                            }
                            {editorLoading === false && currentNote && 
                            <>
                                <div style={{float: 'right'}}>
                                    <Button type="danger" style={{marginRight: '5px'}} onClick={this.deleteNote}>Delete</Button>
                                    <Button type="default" onClick={this.updateNote}>Save</Button>
                                </div>
                                <Input size="large" className="note-title" placeholder="Title" value={currentNote.title} onChange={this.changeTitle} />
                                <ReactQuill theme="snow" value={currentNote.text} onChange={this.changeText} placeholder="Start writting your note here." />
                            </>}
                        </Content>
                    </Layout>
                </Layout>
            </>
        )
    }
}


export default NotePage;