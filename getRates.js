'use strict';
const BFX = require('bitfinex-api-node');
const _ = require('lodash');

const symbols = [
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
  const apiKey = ctx.secrets.BITFINEX_API_KEY;
  const apiSecret = ctx.secrets.BITFINEX_API_SECRET;
  
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  const getRate = (symbol) => {
    bfxRest.ticker(symbol, (err, res) => {
      if (err) cb(null, err);
      const rate = res.last_price;
      // cb(null, rate);
      storeRates(symbol, rate);
    });
  };
  
  const storeRates = (symbol, rate) => {
    ctx.storage.get(function (err, data) {
      if (err) cb(null, err);
      console.log(data);
      let store = data || {};
      store[symbol] = rate;
      ctx.storage.set(store, function (err) {
        if (err) cb(null, err);
        cb(null, store);
      });
    });
  };
  
  getRate(symbols[0]);
};
