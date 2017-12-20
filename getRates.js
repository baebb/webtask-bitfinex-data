'use strict';
const BFX = require('bitfinex-api-node');
const _ = require('lodash');

let symbols = [
  'btcusd',
  'ltcusd',
  'ethusd',
  'etcusd',
  'rrtusd',
  'zecusd',
  'xmrusd',
  'dshusd',
  'bccusd',
  'bcuusd',
  'xrpusd',
  'iotusd',
  'eosusd',
  'sanusd',
  'omgusd',
  'bchusd',
  'neousd',
  'etpusd',
  'qtmusd',
  'bt1usd',
  'bt2usd',
  'avtusd',
  'edousd',
  'btgusd',
  'datusd',
  'qshusd',
  'yywusd',
];

module.exports = (ctx, cb) => {
  console.log('NEW_GET_RATES_REQUEST');
  const apiKey = ctx.secrets.BITFINEX_API_KEY;
  const apiSecret = ctx.secrets.BITFINEX_API_SECRET;
  
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  const getRate = (symbol) => {
    console.log(`GETTING_RATE_FOR ${symbol}`);
    bfxRest.ticker(symbol, (err, res) => {
      if (err) cb(null, err);
      const rate = res.last_price;
      console.log(`GOT_RATE_FOR ${symbol} - ${rate}`);
      storeRates(symbol, rate);
    });
  };
  
  const storeRates = (symbol, rate) => {
    console.log(`STORING_RATE_FOR ${symbol}`);
    ctx.storage.get(function (err, data) {
      if (err) cb(null, err);
      let store = data || {};
      store[symbol] = rate;
      console.log(`GOT_STORE`);
      console.log(store);
      ctx.storage.set(store, function (err) {
        if (err) cb(null, err);
        console.log(`UPDATED_STORE_WITH ${symbol}`);
        getRates(store);
      });
    });
  };
  
  const getRates = (store) => {
    const rateToGet = symbols.shift();
    if (rateToGet !== undefined) {
      getRate(rateToGet);
    } else {
      console.log('GOT_ALL_RATES');
      cb(null, store)
    }
  };
  
  getRates();
};
