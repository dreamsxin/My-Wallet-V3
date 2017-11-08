/* eslint-disable semi */
let { map } = require('ramda')
let cs = require('../../src/bch/coin-selection')
let Coin = require('../../src/bch/coin')

describe('Coin Selection', () => {
  describe('byte sizes', () => {
    it('should return the right transaction size (empty tx)', () => {
      expect(cs.transactionBytes([], [])).toEqual(10)
    })
    it('should return the right transaction size (1 in 2 out tx)', () => {
      expect(cs.transactionBytes([{}], [{}, {}])).toEqual(225)
    })
  })

  describe('effective Balances', () => {
    it('should return the right effective max Balance', () => {
      let inputs = map(Coin.of, [15000, 10000, 20000])
      let outputs = map(Coin.of, [0, 0])
      expect(cs.effectiveBalance(0, inputs, outputs).value).toEqual(45000)
    })
    it('should return the right effective max Balance', () => {
      let inputs = map(Coin.of, [15000, 10000, 20000])
      let outputs = map(Coin.of, [0, 0])
      expect(cs.effectiveBalance(55, inputs, outputs).value).toEqual(16455)
    })
    it('should return the right effective max Balance', () => {
      expect(cs.effectiveBalance(55, [], []).value).toEqual(0)
    })
    it('should return the right effective max Balance', () => {
      expect(cs.effectiveBalance(0, [], []).value).toEqual(0)
    })
  })

  describe('findTarget', () => {
    it('should return the right selection', () => {
      let selection = cs.findTarget([], 0, [])
      expect(selection.fee).toEqual(0)
      expect(selection.inputs).toEqual([])
      expect(selection.outputs).toEqual([])
    })
    it('should return the right selection', () => {
      let inputs = map(Coin.of, [1, 2, 3])
      let targets = map(Coin.of, [10000])
      let selection = cs.findTarget(targets, 0, inputs)
      expect(selection.fee).toEqual(0)
      expect(selection.inputs).toEqual([])
      expect(selection.outputs).toEqual(targets)
    })
    it('should return the right selection', () => {
      let inputs = map(Coin.of, [1, 20000, 300000])
      let targets = map(Coin.of, [10000])
      let selection = cs.findTarget(targets, 55, inputs)
      expect(selection.fee).toEqual(18590)
      expect(selection.inputs.map(x => x.value)).toEqual([20000, 300000])
      expect(selection.outputs.map(x => x.value)).toEqual([10000, 291410])
    })
  })

  // BROKEN by prepareForSplit
  xdescribe('selectAll', () => {
    it('should return the right selection', () => {
      let inputs = map(Coin.of, [1, 20000, 0, 0, 300000])
      let selection = cs.selectAll(55, inputs)
      expect(selection.fee).toEqual(18590)
      expect(selection.inputs.map(x => x.value)).toEqual([20000, 300000])
      expect(selection.outputs.map(x => x.value)).toEqual([301410])
    })
    it('should return the right selection', () => {
      let inputs = map(Coin.of, [])
      let selection = cs.selectAll(55, inputs)
      expect(selection.fee).toEqual(0)
      expect(selection.inputs.map(x => x.value)).toEqual([])
      expect(selection.outputs.map(x => x.value)).toEqual([0])
    })
  })

  describe('descentDraw', () => {
    it('should return the right selection', () => {
      let inputs = map(Coin.of, [1, 20000, 0, 0, 300000, 50000, 30000])
      let targets = map(Coin.of, [100000])
      let selection = cs.descentDraw(targets, 55, inputs, 'change-address')
      expect(selection.fee).toEqual(10505)
      expect(selection.inputs.map(x => x.value)).toEqual([300000])
      expect(selection.outputs.map(x => x.value)).toEqual([100000, 189495])
    })
  })

  describe('prepareForSplit', () => {
    let replayable = (value) => new Coin({ value, replayable: true })
    let nonreplayable = (value) => new Coin({ value, replayable: false })

    it('should leave an empty array unchanged', () => {
      expect(cs.prepareForSplit([])).toEqual([])
    })
    it('should sort like [smallest_nonreplayable, ...replayable_descending, ...nonreplayable_descending]', () => {
      let coins = [replayable(5000), nonreplayable(10000), nonreplayable(15000), replayable(20000), nonreplayable(30000)]
      let splitCoins = cs.prepareForSplit(coins)
      expect(splitCoins.map(c => c.value)).toEqual([10000, 20000, 5000, 30000, 15000])
    })
    it('should force include the first coin if not all are replayable', () => {
      let coins = [replayable(5000), nonreplayable(10000)]
      let splitCoins = cs.prepareForSplit(coins)
      expect(splitCoins[0].forceInclude).toEqual(true)
    })
    it('should not force include the first coin if all are replayable', () => {
      let coins = [replayable(5000), replayable(10000)]
      let splitCoins = cs.prepareForSplit(coins)
      expect(splitCoins[0].forceInclude).not.toEqual(true)
    })
  })
})
