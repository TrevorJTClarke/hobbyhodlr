const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '/secrets/.env') })
const axios = require('axios')

class Slack {
  constructor() {
    return this
  }

  getHookUrl(options) {
    const id = process.env.SLACK_WEBHOOK || ''
    return `https://hooks.slack.com/services/${id}`
  }

  send(payload) {
    if (!payload.active) return
    const url = this.getHookUrl(payload)
    const data = {
      channel: process.env.SLACK_CHANNEL ? `#${process.env.SLACK_CHANNEL}` : '#general',
      username: 'HobbyHodlr',
      // Example: 'Alert! You need to do something! <https://url.com|Click here>'
      text: payload.text || 'Price Update!',
      icon_emoji: payload.icon || ':tropical_drink:',
      // icon_url: 'https://url.com/image.png'
      ...payload,
    }
    return axios.post(url, JSON.stringify(data)).then(res => (res), err => {
      console.log('err', err)
    })
  }
}

module.exports = new Slack()
