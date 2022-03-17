const test = require('ava')
const { uniqueTotals, getFormattedAccountItem } = require('../modules/accounting/helpers')
const { chains } = require('../modules/providers/near')

const testData = [
	{
		_id: 1,
		assetId: '1234abcd',
		totalUnits: '10',
		totalUnitsUSD: '100',
	},
	{
		_id: 2,
		assetId: '1234abcd',
		manualUnits: '10',
		totalUnitsUSD: '100',
	},
	{
		_id: 3,
		assetId: '1234abcde',
		totalUnits: '1',
		totalStaked: '5',
		totalUnitsUSD: '15',
		totalStakedUSD: '75',
	},
	{
		_id: 4,
		assetId: '1234abcde',
		totalPendingRewards: '5',
		totalPendingRewardsUSD: '75',
	},
]

test('Accounting: Dedupe accounts, totals', t => {
	const uniques = uniqueTotals(testData)
	t.is(uniques[0].totalUnits, '10')
	t.is(uniques[0].manualUnits, '10')
	t.is(uniques[0].totalUnitsUSD, '200')

	t.is(uniques[1].totalUnits, '1')
	t.is(uniques[1].totalUnitsUSD, '15')
	t.is(uniques[1].totalStaked, '5')
	t.is(uniques[1].totalStakedUSD, '75')
	t.is(uniques[1].totalPendingRewards, '5')
	t.is(uniques[1].totalPendingRewardsUSD, '75')
})
