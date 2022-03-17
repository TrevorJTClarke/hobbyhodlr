import Vue from 'vue'
import Vuex from 'vuex'

// Global Store
import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import state from './state'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: false,
  actions,
  getters,
  mutations,
  state,
})

// store.subscribe((mutation, state) => {
// 	Object.keys(state).forEach(k => {
//     const value = typeof state[k] === 'object' ? JSON.stringify(state[k]) : state[k]
//     if (value) localStorage.setItem(`ivu-${k}`, value)
//   })
// })

export default store
