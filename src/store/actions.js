import Vue from 'vue'

export default {
  // Generic Update
  update({ commit }, { key, value }) {
    commit('UPDATE', { key, value })
  },

  pushItem({ commit }, { key, value }) {
    commit('PUSH', { key, value })
  },

  deleteItem({ commit }, { key, idx }) {
    commit('DELETE', { key, idx })
  },

  addSubItem({ commit }, { key, subKey, value }) {
    commit('ADDSUBITEM', { key, subKey, value })
  },

  removeSubItem({ commit }, { key, subKey }) {
    commit('REMOVESUBITEM', { key, subKey })
  },

  setApiKey({ commit }, apiKey) {
    commit('UPDATE', { key: 'apiKey', value: apiKey })
  },

  logout({ commit }) {
    localStorage.removeItem('token')
    commit('UPDATEALL', {
      initialized: false,
      authenticated: false,
      rememberlogin: null,
      token: null,
      username: null,
      user: {},
      adminId: null,
      alphavantageId: null,
      amberdataId: null,
      infuraId: null,
      portisDappId: null,
      quandlId: null,
    })
  },
}
