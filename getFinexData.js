'use strict';
const BFX = require('bitfinex-api-node');
const _ = require('lodash');

let taskName;
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
  const apiKey = ctx.secrets.BITFINEX_API_KEY;
  const apiSecret = ctx.secrets.BITFINEX_API_SECRET;
  const bfxRest = new BFX(apiKey, apiSecret, {version: 1}).rest;
  
  const getRate = (symbol) => {
    console.log(`${taskName} GETTING_RATE: ${symbol}`);
    bfxRest.ticker(symbol, (err, res) => {
      if (err) {
        console.log(`${taskName} GET_RATE_ERROR:`);
        console.log(err);
        cb(null, err);
      }
      const rate = res.last_price;
      storeRates(symbol, rate);
    });
  };
  
  const storeRates = (symbol, rate) => {
    console.log(`${taskName} STORING_RATE: ${symbol} - $${rate}`);
    ctx.storage.get(function (err, data) {
      if (err) {
        console.log(`${taskName} GET_RATE_STORE_ERROR:`);
        console.log(err);
        cb(null, err);
      }
      let store = data || {};
      store[symbol] = rate;
      ctx.storage.set(store, function (err) {
        if (err) {
          console.log(`${taskName} UPDATE_RATE_STORE_ERROR:`);
          console.log(err);
          cb(null, err);
        }
        getRates(store);
      });
    });
  };
  
  const getRates = (store) => {
    const rateToGet = symbols.shift();
    if (rateToGet !== undefined) {
      getRate(rateToGet);
    } else {
      console.log(`${taskName} GOT_ALL_RATES`);
      cb(null, store)
    }
  };
  
  const buildBalance = (wallet, rates) => {
    console.log(`${taskName} BUILDING_BALANCE`);
    let totals = {};
    wallet.forEach((walletObj) => {
      const { currency, amount } = walletObj;
      const amountNum = Number(amount);
      const currencyUsd = `${currency}usd`;
      
      if (totals[currency] === undefined) {
        console.log(`${taskName} ADDING_NEW_CURRENCY: ${currency} - ${amountNum}`);
        totals[currency] = {};
        totals[currency].holding = amountNum;
        if (currency !== 'usd') {
          totals[currency].value = amountNum * rates[currencyUsd];
        }
        else {
          totals[currency].value = amountNum;
        }
      }
      else {
        console.log(`${taskName} ADDING_TO_EXISTING_CURRENCY: ${currency} - ${amountNum}`);
        const currentTotal = totals[currency].holding;
        const newTotal = currentTotal + amountNum;
        totals[currency].holding = newTotal;
        if (currency !== 'usd') {
          totals[currency].value = newTotal * rates[currencyUsd];
        }
        else {
          totals[currency].value = newTotal;
        }
      }
    });
    
    let res = {};
    res.assets = totals;
    res.timestamp = Date.now();
    res.totalValue = 0;
    _.each(totals, (currencyObj, key) => {
      if (_.isNumber(currencyObj.value) && !_.isNaN(currencyObj.value)) {
        console.log(`${taskName} ADDING_TO_TOTAL: ${key} - $${currencyObj.value}`);
        res.totalValue += currencyObj.value;
      }
    });
    console.log(`${taskName} BALANCE_BUILD_COMPLETE`);
    cb(null, res);
  };
  
  const getWallet = () => {
    bfxRest.wallet_balances((err, res) => {
      if (err) {
        console.log(`${taskName} GET_WALLET_ERROR:`);
        console.log(err);
        cb(null, err);
      }
      console.log(`${taskName} GOT_WALLET`);
      ctx.storage.get(function (err, data) {
        if (err) {
          console.log(`${taskName} GET_RATE_STORE_ERROR:`);
          console.log(err);
          cb(null, err);
        }
        if (data === {}) {
          console.log(`${taskName} RATE_STORE_EMPTY`);
          cb(null, 'RATE_STORE_EMPTY');
        }
        else {
          console.log(`${taskName} GOT_RATE_STORE`);
          buildBalance(res, data);
        }
      });
    });
  };
  
  if (ctx.query.summary === 'true') {
    console.log(`NEW_GET_BALANCES_REQUEST`);
    taskName = 'GET_BALANCES';
    getWallet()
  } else {
    console.log(`NEW_GET_RATES_REQUEST`);
    taskName = 'GET_RATES';
    getRates();
  }
};
