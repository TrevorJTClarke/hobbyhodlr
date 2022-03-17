<template>
  <div class="account-item">
    <div class="account-brand">
      <Avatar v-if="imgSrc" :shape="avtShape" size="large" :style="`background-color: ${brandColor}`" :src="imgSrc" />
      <Avatar v-if="!imgSrc" :shape="avtShape" size="large" :style="`background-color: ${brandColor}`">{{ symbol }}</Avatar>

      <div class="account-brand-title">
        <h4 :title="data.address">{{ hashShorten(data.address, 30) }}</h4>
        <label>
          <i class="chip">{{ symbol }}</i>
          <i class="chip" v-if="data.category">{{ data.category }}</i>
          <span v-if="data.nickname">{{ data.nickname }}</span>
        </label>
        <!-- <br> -->
        <!-- <label v-if="data.operatorAddress" :title="data.operatorAddress"><span>Delegator:</span> {{ hashShorten(data.operatorAddress, 20) }}</label> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { hashShorten } from '@/utils/filters'
import formatters from '@/utils/formatters.js'

export default {
  name: 'AccountItem',
  props: ['data'],

  data() {
    return {
      hashShorten,
    }
  },

  computed: {
    asset() {
      return this.data && this.data.asset ? this.data.asset : null
    },
    brand() {
      const baseUrl = window.location.host.search('localhost') !== -1 ? '/static/' : '/'
      let brand

      // some items already have logo urls
      if (this.asset) brand = { logo: `${baseUrl}logos/${this.asset.icon}` }

      return brand
    },
    symbol() {
      if (!this.asset || !this.asset.symbol) return ''
      return this.asset.symbol.toUpperCase()
    },
    avtShape() {
      return this.data.type === 'cryptocurrency' ? 'circle' : 'square'
    },
    name() {
      return this.asset.name
    },
    imgSrc() {
      if (!this.brand || !this.brand.logo) return
      return this.brand.logo
    },
    brandColor() {
      if (this.imgSrc && this.asset.type === 'cryptocurrency') return 'var(--bg-secondary)'
      if (this.asset && this.asset.colors) return formatters.getColorFromRaw(this.asset.colors)
    },
  },
}
</script>

<style>
.account-item {
  display: flex;
  margin: 5px 0;
}
.account-brand {
  display: flex;
}
.account-brand img {
  width: 40px;
  height: 40px;
  display: block;
  margin: auto 10px auto auto;
}
.account-brand .default-brand-icon {
  width: 40px;
  height: 40px;
  margin: auto 10px auto auto;
  display: block;
  border-radius: 50px;
  color: white;
  text-align: center;
  padding: 9px 0 0;
}
.account-brand-title {
  margin: auto 10px;
  display: flex;
  flex-direction: column;
}
.account-brand-title h3 {
  font-size: 14pt;
  line-height: 14pt;
}
.account-brand-title label {
  font-size: 10pt;
  opacity: 0.7;
}
.account-amounts {
  display: flex;
  margin-left: auto;
}
.account-amount {
  margin: auto auto auto 20px;
  text-align: right;
}
.account-amount.account-amount-muted {
  opacity: 0.5;
}

.chip {
  background: #999;
  border-radius: 4px;
  color: white;
  padding: 2px 5px;
  font-size: 7pt;
  font-weight: 500;
  font-style: normal;
  vertical-align: top;
  margin: 1px 0 0;
  display: inline-block;
  text-transform: uppercase;
}
</style>
