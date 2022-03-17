import axios from 'axios'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import VueApollo from 'vue-apollo'
import store from './store'
import router from './router'
import App from './App'
import ViewUI from 'view-design'
import locale from './locale.js'
import 'view-design/dist/styles/iview.css'
import './theme/index.less'

import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import { setContext } from 'apollo-link-context'
import { ApolloLink, split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

const baseServerUrl = `http://${window.location.hostname}:2000`
const authToken = () => { return localStorage.getItem('token') }

// Create an http link:
const httpLink = new HttpLink({
  uri: `${baseServerUrl}/graphql`
})

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: `ws://${window.location.hostname}:2000/graphql`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: authToken(),
    },
  },
})

// Setup authentication middleware
const middlewareLink = setContext(() => ({
  headers: {
    authentication: `Bearer ${authToken()}`
  }
}))
const authHttpLink = middlewareLink.concat(httpLink)

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authHttpLink,
)

const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

Vue.config.productionTip = false
Vue.use(VueApollo)
Vue.use(ViewUI, { locale })

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>',
  apolloProvider,
  store,
  router,

  beforeCreate() {
		this.$store.commit('initialiseStore')
	}
})
