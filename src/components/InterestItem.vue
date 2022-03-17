<template>
  <div class="asset-item">
    <div :class="['asset-brand', isSmall ? 'small' : '']">
      <Avatar v-if="!imgSrc" size="large" shape="circle" :style="{background: brandColor}">{{ symbol.substring(0,3) }}</Avatar>
      <Avatar v-if="imgSrc" size="large" shape="circle" src="https://i.loli.net/2017/08/21/599a521472424.jpg" />
      <div class="asset-brand-title">
        <h3>{{ assetName }}</h3>
        <label v-if="!isSmall">{{ symbol }} <span v-if="assetPrice">{{ assetPrice }}</span> </label>
      </div>
    </div>
    <div class="asset-amounts">
      <div class="asset-amount">
        <h3>{{ assetRate }}</h3>
        <label v-if="assetSpread && !isSmall">{{ assetSpread }} <small>Variance</small></label>
        <label v-if="hasBorrow && !isSmall">
          <small>Borrow:</small>
          <span v-if="borrowV">{{ borrowV }} <small>Variable</small></span>
          <span v-if="borrowS">{{ borrowS }} <small>Stable</small></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { displayAsCurrency, toRawFixedValue } from '@/utils/filters.js'
// import brands from '../../static/brandColors.json'

export default {
  name: 'InterestItem',
  props: ['data', 'isSmall'],

  computed: {
    ...mapGetters(['assets']),
    brand() {
      // if (!brands || !this.symbol) return {}
      const sym = this.symbol.toLowerCase()
      let brand

      // brands.forEach(b => {
      //   if (b.symbol === sym) brand = b
      // })

      if (!brand) return {}

      // add img url
      const baseUrl = window.location.host.search('localhost') !== -1 ? '/static/' : '/'
      brand.logo = `${baseUrl}logos/${brand.name.replace(/ /g, '_').toLowerCase()}_${sym}.png`

      return brand
    },
    symbol() {
      if (!this.data || !this.data.symbol) return ''
      return this.data.symbol.toUpperCase()
    },
    imgSrc() {
      if (!this.brand || !this.brand.logo) return
      return this.brand.logo
    },
    brandColor() {
      if (!this.brand || !this.brand.colors) return 'rgba(81, 213, 176, 0.7)'
      return this.brand.colors[0]
    },
    assetName() {
      if (!this.assets || !this.assets[this.symbol.toLowerCase()]) return this.data.name || ''
      return this.assets[this.symbol.toLowerCase()].name
    },
    assetPriceRaw() {
      if (!this.assets || !this.assets[this.symbol.toLowerCase()]) return ''
      return this.assets[this.symbol.toLowerCase()].currentPrice
    },
    assetPrice() {
      if (!this.assetPriceRaw) return ''
      return displayAsCurrency(this.assetPriceRaw)
    },
    assetRate() {
      if (!this.data || (!this.data.rate && !this.data.reward)) return ''
      return toRawFixedValue(this.data.rate || this.data.reward, 2) + '%'
    },
    assetSpread() {
      if (!this.data || !this.data.spread || this.data.spread === '0') return ''
      return toRawFixedValue(this.data.spread, 2) + '%'
    },
    hasBorrow() {
      if (!this.data) return false
      return (this.data.borrowV || this.data.borrowS)
    },
    borrowV() {
      if (!this.data.borrowV || this.data.borrowV === '0') return
      return toRawFixedValue(this.data.borrowV, 2) + '%'
    },
    borrowS() {
      if (!this.data.borrowS || this.data.borrowS === '0') return
      return toRawFixedValue(this.data.borrowS, 2) + '%'
    },
  },
}
</script>

<style>
.asset-item {
  display: flex;
  margin: 5px 0;
  width: 100%;
}
.asset-brand {
  display: flex;
}
.asset-brand img {
  border-radius: 50px;
  width: 40px;
  height: 40px;
  display: block;
  margin: auto;
}
.asset-brand.small img {
  width: 30px;
  height: 30px;
}
.asset-brand-title {
  margin: auto 10px;
  display: flex;
  flex-direction: column;
}
.asset-brand-title h3 {
  font-size: 14pt;
  line-height: 14pt;
}
.asset-brand-title label {
  font-size: 10pt;
  opacity: 0.7;
}
.asset-amounts {
  display: flex;
  margin-left: auto;
}
.asset-amount {
  margin: auto auto auto 20px;
  text-align: right;
}
.asset-amount.asset-amount-muted {
  opacity: 0.5;
}
.asset-amount small {
  font-size: 7pt;
  text-transform: uppercase;
  font-weight: 600;
}
</style>
