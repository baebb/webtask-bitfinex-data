'use strict';
const BFX = require('bitfinex-api-node');

module.exports = (ctx, cb) => {
  const apiKey = ctx.secrets.BITFINEX_API_KEY;
  const apiSecret = ctx.secrets.BITFINEX_API_SECRET;
  
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  bfxRest.wallet_balances((err, res) => {
    if (err) cb(null, err);
    ctx.storage.get(function (err, data) {
      if (err) cb(null, err);
      cb(null, data);
    });
    // cb(null, res);
  });
};
