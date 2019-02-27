import React from 'react'

export default React.createContext({
    text: '',
    title: '',
    login: (token, userId) => {},
    logout: () => {}
})