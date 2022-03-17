<template>
  <div class="asset-item">
    <div class="asset-brand">

      <Avatar v-if="imgSrc" :shape="avtShape" size="large" :style="`background-color: ${brandColor}`" :src="imgSrc" />
      <Avatar v-if="!imgSrc" :shape="avtShape" size="large" :style="`background-color: ${brandColor}`">{{ symbol }}</Avatar>

      <div class="asset-brand-title">
        <h3>{{ data.name }}</h3>
        <label>{{ symbol }} <span v-if="assetPrice && !hidePrice">{{ assetPrice }}</span> </label>
      </div>
    </div>
    <div class="asset-amounts">
      <div v-if="totalPendingRewards" class="asset-amount">
        <h4>{{ totalValue }} : {{ totalPendingRewardsValue }}</h4>
        <label :title="totalUnits"> <strong>{{ totalUnits }}</strong> : </label>
        <label :title="totalPendingRewards">{{ totalPendingRewards }} {{ symbol }}</label>
      </div>
      <div v-if="!totalPendingRewards" class="asset-amount">
        <h4>{{ totalValue }} </h4>
        <label v-if="totalUnits" :title="totalUnits">{{ totalUnits }} {{ symbol }}</label>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { displayAsCurrency } from '@/utils/filters.js'
import formatters from '@/utils/formatters.js'

export default {
  name: 'AssetItem',
  props: ['data', 'parent', 'hidePrice'],

  computed: {
    brand() {
      const baseUrl = window.location.host.search('localhost') !== -1 ? '/static/' : '/'
      let brand

      // some items already have logo urls
      if (this.data.icon) brand = { logo: `${baseUrl}logos/${this.data.icon}` }

      return brand
    },
    symbol() {
      if (!this.data || !this.data.symbol) return ''
      return this.data.symbol.toUpperCase()
    },
    avtShape() {
      return this.data.type === 'cryptocurrency' ? 'circle' : 'square'
    },
    assetPriceRaw() {
      if (this.data && this.data.currentPrice) return this.data.currentPrice
      return ''
    },
    assetPrice() {
      if (!this.assetPriceRaw) return ''
      return displayAsCurrency(this.assetPriceRaw)
    },
    totalUnits() {
      if (!this.data) return 0
      if (this.parent && this.parent.manualUnits) return parseFloat(this.parent.manualUnits)
      const units = this.parent.totalUnits || this.data.totalUnits
      // const decimals = `1e${this.data.decimals || 0}`
      // return parseFloat(units / decimals)
      return parseFloat(units)
    },
    totalValue() {
      if (!this.parent) return ''
      if (this.parent.totalUnitsUSD) return displayAsCurrency(this.parent.totalUnitsUSD)
      if (this.totalUnits && this.assetPriceRaw) return displayAsCurrency(parseFloat(this.totalUnits) * parseFloat(this.assetPriceRaw))
      return ''
    },
    totalStakedUnits() {
      if (!this.parent || !this.parent.totalStakedUnits) return ''
      return this.parent.totalStakedUnits
    },
    totalPendingRewards() {
      if (!this.parent || !this.parent.totalPendingRewards) return ''
      return this.parent.totalPendingRewards ? parseFloat(this.parent.totalPendingRewards).toFixed(4) : ''
    },
    totalPendingRewardsValue() {
      if (!this.parent || !this.parent.totalPendingRewardsUSD) return ''
      return displayAsCurrency(this.parent.totalPendingRewardsUSD)
    },
    imgSrc() {
      if (!this.brand || !this.brand.logo) return
      return this.brand.logo
    },
    brandColor() {
      if (this.imgSrc && this.data.type === 'cryptocurrency') return 'var(--bg-secondary)'
      if (this.data && this.data.colors) return formatters.getColorFromRaw(this.data.colors)
    },
  },
}
</script>

<style>
.asset-item {
  display: flex;
  margin: 5px 0;
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
.asset-brand .default-brand-icon {
  width: 40px;
  height: 40px;
  display: block;
  border-radius: 50px;
  color: white;
  text-align: center;
  padding: 9px 0 0;
}
.asset-brand.traditional img,
.asset-brand.traditional .default-brand-icon {
  border-radius: 4px;
}
.asset-brand-title {
  margin: 2px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.asset-brand-title h3 {
  font-size: 14pt;
  font-weight: 300;
  line-height: 14pt;
}
.asset-brand-title label {
  font-size: 8pt;
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
.asset-amount label {
  font-size: 8pt;
}
.asset-amount.asset-amount-muted {
  opacity: 0.5;
}
</style>
