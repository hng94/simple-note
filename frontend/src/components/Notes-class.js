import React, { Component } from 'react'
import { Timeline, Input, Button, Spin, Popover, Select, Modal, Layout, Menu, Icon, } from 'antd';
import AuthContext from '../contexts/auth-context';
import ReactQuill from 'react-quill'; // ES6
import { Code as CodeLoader } from 'react-content-loader'
import debounce from 'lodash/debounce';

const Option = Select.Option

const { Content, Sider } = Layout;
const url = 'http://localhost:8000/graphql'

class NotePage extends Component {
    static contextType = AuthContext;
    constructor(props) {
        super(props)
        this.state = {
            currentNote: {},
            notes: [],
            editorLoading: true,
            listLoading: true,
            query: "",
            versions: [],
            sharedUsers: [],
            fetching: false,
            users: []
        }
        this.fetchUser = debounce(this.fetchUser, 500)
        this.showDeleteConfirm = this.showDeleteConfirm.bind(this)
    }

    componentDidMount() {
        this.getNotes()
    }

    changeTitle = e => {
        const title = e.target.value;
        const { currentNote } = this.state
        this.setState({
            currentNote: {
                ...currentNote,
                title
            }
        })
    }

    changeText = (text) => {
        const { currentNote } = this.state
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
                  sharedUsers
                  createdBy
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
        const { data: { notes } } = resJson;
        const notesObj = {}
        notes.forEach(e => {
            notesObj[e._id] = e
        });
        const currentNote = notes[0] || {}
        this.setState({
            notes: notesObj,
            currentNote,
            listLoading: false,
            editorLoading: false
        })
        console.log(this.state)
    }

    deleteNote = async () => {
        const { currentNote } = this.state
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
        const { data: { deleteNote } } = resJson
        const { notes } = this.state
        const { [deleteNote]: deleted, ...rest } = notes
        const first = Object.keys(rest)[0] || null
        const newCurrentNote = rest[first] || {}
        this.setState({
            notes: rest,
            currentNote: newCurrentNote,
            editorLoading: false
        })
        console.log(this.state)
    }

    updateNote = async () => {
        const { currentNote } = this.state
        const requestBody = {
            query: `mutation
                {
                    updateNote(noteInput: {title: "${currentNote.title}", text: "${currentNote.text}", _id: "${currentNote._id}", createdBy: "${this.context.userId}"}) {
                        title
                        text
                        _id
                        createdBy
                        sharedUsers
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
        const { data: { updateNote } } = resJson;
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
                        createdBy
                        sharedUsers
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
        const { data: { createNote } } = resJson
        const { notes } = this.state
        notes[createNote._id] = createNote
        this.setState({
            currentNote: createNote,
            notes
        })
    }

    selectNote = async ({ key }) => {
        const { notes } = this.state
        const currentNote = notes[key]
        this.setState({
            currentNote: currentNote
        })
    }

    onSearch = e => {
        const query = e.target.value
        this.setState({
            query
        })
    }

    selectVersion = versionId => {
        const { versions, currentNote } = this.state
        const selectedVersion = versions.filter(v => v._id === versionId)[0]
        this.setState({
            currentNote: {
                ...currentNote,
                title: selectedVersion.title,
                text: selectedVersion.text
            }
        })
    }

    getVersions = async () => {
        const { currentNote } = this.state
        const requestBody = {
            query: `
            {
                versions(noteId: "${currentNote._id}") {
                  title
                  text
                  created
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
        const { data: { versions } } = resJson;
        this.setState({
            versions
        })
    }

    fetchUser = async value => {
        this.setState({
            users: [],
            fetching: true
        })
        const requestBody = {
            query: `
            {
                fetchUsers(query: "${value}", userId: "${this.context.userId}")
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
        const { data: { fetchUsers } } = resJson;
        this.setState({
            users: fetchUsers,
            fetching: false
        })
    }

    handleSharedUserChange = async (users) => {
        const {currentNote} = this.state
        const requestBody = {
            query: `
            mutation 
                ShareNote($users: [String]) {
                    shareNote(noteInput: {_id: "${currentNote._id}", sharedUsers: $users}) {
                        sharedUsers
                    }
                }
              
            `,
            variables: {
                users
            }
        }
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-type': 'application/json'
            }
        })
        const resJson = await res.json();
        const { data: { shareNote } } = resJson;
        this.setState({
            currentNote: {
                ...this.state.currentNote,
                sharedUsers: shareNote.sharedUsers
            },
            users: [],
            fetching: false,
        });
    }

    showDeleteConfirm() {
        Modal.confirm({
          title: 'Are you sure delete this note?',
          content: 'This action can not be undone',
          okText: 'Yes',
          okType: 'danger',
          cancelText: 'No',
          onOk: () => {
              debugger
            this.deleteNote()
          },
          onCancel() {
            console.log('close delete');
          },
        });
      }
      
    render() {
        const timestampToDate = ts => {
            const dt = new Date(parseInt(ts))
            return dt.toLocaleString()
        }
        const { notes, currentNote, editorLoading, query, versions, sharedUsers, fetching, users} = this.state
        const currentId = currentNote ? currentNote._id : null

        const timelines = (
            <Timeline>
                {versions.map(v =>
                    <Timeline.Item onClick={() => this.selectVersion(v._id)} key={v._id}>Created {timestampToDate(v.created)}</Timeline.Item>
                )}
            </Timeline>
        )

        const sharedList = (
            <Select
                mode="multiple"
                value={currentNote.sharedUsers}
                placeholder="Select users"
                notFoundContent={fetching ? <Spin size="large" /> : null}
                filterOption={false}
                onSearch={this.fetchUser}
                onChange={this.handleSharedUserChange}
                style={{ minWidth: '150px', maxWidth: '300px' }}
            >
            {users.map(d => <Option key={d}>{d}</Option>)}
          </Select>
        )
        return (
            <>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider width={250} style={{ background: '#fff' }}>
                        <Menu
                            theme="light"
                            mode="inline"
                            defaultOpenKeys={["myNotes", "sharedNotes"]}
                            selectedKeys={[currentId]}
                            style={{ height: '100%', borderRight: 0 }}
                        >
                            <Menu.Item>
                                <Icon type="user" /> {this.context.email}
                            </Menu.Item>
                            <Menu.Item style={{ color: 'red' }} onClick={this.context.logout}>
                                <Icon type="logout" /> Log out
                            </Menu.Item>
                            <Menu.Item>
                                <Input.Search
                                    allowClear
                                    placeholder="input search text"
                                    onChange={this.onSearch}
                                    style={{ width: 200 }}
                                />
                            </Menu.Item>
                            <Menu.Item onClick={this.addNote}>
                                <Icon type="plus-circle" /> New note
                            </Menu.Item>
                            <Menu.SubMenu key="myNotes" title={<span><Icon type="folder" /><span>My notes</span></span>}>
                                {Object.keys(notes).length > 0 &&
                                    Object.keys(notes).filter(_id => notes[_id].createdBy === this.context.userId && notes[_id].title.toLowerCase().startsWith(query.toLowerCase())).map(_id =>
                                        <Menu.Item onClick={this.selectNote} key={_id}>
                                            <Icon type="file-text" /> {notes[_id].title || 'Untitled'}
                                        </Menu.Item>)
                                }
                            </Menu.SubMenu>
                            <Menu.SubMenu key="sharedNotes" title={<span><Icon type="share-alt" /><span>Shared notes</span></span>}>
                                {Object.keys(notes).length > 0 &&
                                    Object.keys(notes).filter(_id => notes[_id].createdBy !== this.context.userId && notes[_id].title.toLowerCase().startsWith(query.toLowerCase())).map(_id =>
                                        <Menu.Item onClick={this.selectNote} key={_id}>
                                            <Icon type="file-text" /> {notes[_id].title || 'Untitled'}
                                        </Menu.Item>)
                                }
                            </Menu.SubMenu>
                        </Menu>
                        {notes === null &&
                            <div className="loading-container">
                                <Spin />
                            </div>
                        }
                    </Sider>
                    <Layout style={{ padding: '20px' }}>
                        <Content className="card-1" style={{
                            background: '#fff', padding: 24, margin: 0, minHeight: 280,
                        }}
                        >
                            {(editorLoading === true) &&
                                <CodeLoader />
                            }
                            {editorLoading === false && Object.keys(currentNote).length === 0 && <p>Welcome to FH Kiel Simple Note, click <b>New note</b> to start your productive day</p>}
                            {editorLoading === false && Object.keys(currentNote).length  !== 0 &&
                                <>
                                    <div className="control-group">
                                        <Popover
                                            onClick={this.getVersions}
                                            placement="leftTop"
                                            content={timelines}
                                            trigger="click"
                                        >
                                            <Button type="default" shape="circle" icon="clock-circle"></Button>
                                        </Popover>
                                        {this.context.userId === currentNote.createdBy && 
                                        <Popover
                                            // onClick={this.getVersions}
                                            content={sharedList}
                                            trigger="click"
                                        >
                                            <Button type="default" shape="circle" icon="user-add"></Button>
                                        </Popover>}
                                        {this.context.userId === currentNote.createdBy && <Button type="danger" shape="circle" icon="delete" onClick={this.showDeleteConfirm}></Button>}
                                        <Button type="primary" shape="circle" icon="save" onClick={this.updateNote}></Button>
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