'use strict';
const BFX = require('bitfinex-api-node');

module.exports = (ctx, cb) => {
  const apiKey = ctx.secrets.BITFINEX_API_KEY;
  const apiSecret = ctx.secrets.BITFINEX_API_SECRET;
  
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  bfxRest.ticker('BTCUSD', (err, res) => {
    if (err) console.log(err);
    cb(null, res);
  });
};
