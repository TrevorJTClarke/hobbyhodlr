import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/pages/Home'
import Research from '@/pages/Research'
import Accounts from '@/pages/Accounts'
import Login from '@/pages/Login'
import Setup from '@/pages/Setup'
import Settings from '@/pages/Settings'

Vue.use(Router)

export default new Router({
  // mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Portfolio',
      component: Home
    },
    {
      path: '/accounts',
      name: 'Accounts',
      component: Accounts
    },
    {
      path: '/research',
      name: 'Research',
      component: Research
    },
    {
      path: '/auth',
      name: 'Login',
      component: Login
    },
    {
      path: '/setup',
      name: 'Setup',
      component: Setup
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    },
  ]
})
