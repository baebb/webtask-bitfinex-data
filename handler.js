'use strict';
const BFX = require('bitfinex-api-node');

module.exports = (context, cb) => {
  const apiKey = context.secrets.BITFINEX_API_KEY;
  const apiSecret = context.secrets.BITFINEX_API_SECRET;
  
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  bfxRest.wallet_balances((err, res) => {
    if (err) cb(null, err);
    cb(null, res);
  });
};
