import jwt from 'jsonwebtoken'

export default {
  initialiseStore(state) {
    const cacheKeys = ['token', 'username', 'rememberlogin']
    const cache = {}

    // check if token is valid, if not remove from storage
    const token = localStorage.getItem('token')
    if (token && jwt.decode(token)) {
      const tkn = jwt.decode(token)
      const expiry = tkn.exp * 1000
      if (+new Date() > expiry) localStorage.removeItem('token')
      else cache.authenticated = true

      if (tkn.user) cache['user'] = tkn.user
    }

		// Check if the ID exists
    cacheKeys.forEach(k => {
      if (localStorage.getItem(k)) cache[k] = localStorage.getItem(k)
    })
    this.replaceState({ ...state, ...cache })
	},

  // Generic update
  UPDATE(state, { key, value }) {
    state[key] = value
  },

  UPDATEALL(state, obj) {
    Object.keys(obj).forEach(k => {
      state[k] = obj[k]
    })
  },

  PUSH(state, { key, value }) {
    if (!state[key] || !Array.isArray(state[key])) return
    state[key].push(value)
  },

  DELETE(state, { key, idx }) {
    if (!state[key] || !Array.isArray(state[key])) return
    state[key].splice(idx, 1)
  },

  ADDSUBITEM(state, { key, subKey, value }) {
    if (!state[key]) return
    // flush cache
    delete state[key][subKey]
    // next tick
    setTimeout(() => {
      state[key][subKey] = value
    }, 100)
  },

  REMOVESUBITEM(state, { key, subKey }) {
    if (!state[key]) return
    delete state[key][subKey]
  },
}
