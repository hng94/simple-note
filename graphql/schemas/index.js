const { buildSchema } = require('graphql');

module.exports = buildSchema(`

type Note {
  _id: ID!
  title: String!
  text: String!
  created: String!
  modified: String!
}

type User {
  _id: ID!
  email: String!
  password: String
}

type AuthData {
  userId: ID!
  token: String!
  tokenExpiration: Int!
}

input NoteInput {
  _id: String
  title: String
  text: String
  createdBy: String!
}

input UserInput {
  email: String!
  password: String!
}

type RootQuery {
    notes(userId: String!): [Note!]!
    login(email: String!, password: String!): AuthData!
}

type RootMutation {
    createNote(noteInput: NoteInput): Note
    updateNote(noteInput: NoteInput): Note
    deleteNote(_id: String!, createdBy: String!): String!
    createUser(userInput: UserInput): User
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);