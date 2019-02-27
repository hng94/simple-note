const auth = require('./auth')
const notes = require('./notes')

const rootResolver = {
    ...auth,
    ...notes
}

module.exports = rootResolver;
