'use strict';
'use latest';
const BFX = require('bitfinex-api-node');
const _ = require('lodash');
const async = require('async');

let taskName;
let symbols = [
  'btcusd',
  'ltcusd',
  'ethusd',
  'bchusd',
  'neousd',
  'xrpusd',
  'iotusd',
  'etcusd',
  'rrtusd',
  'zecusd',
  'eosusd',
  'sanusd',
  'omgusd',
  'xmrusd',
  'dshusd',
  'bccusd',
  'bcuusd',
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
  const bfxRest = new BFX(apiKey, apiSecret, { version: 1 }).rest;
  
  const getStore = () => {
    return new Promise((resolve, reject) => {
      ctx.storage.get((err, data) => {
        if (err) {
          console.log(`${taskName} GET_STORE_ERROR:`);
          console.log(err);
          reject(err);
        }
        const store = data || {};
        resolve(store);
      });
    });
  };
  
  const setStore = (newStore) => {
    return new Promise((resolve, reject) => {
      ctx.storage.set(newStore, err => {
        if (err) {
          console.log(`${taskName} SET_STORE_ERROR:`);
          console.log(err);
          reject(err);
        }
        resolve(newStore);
      });
    });
  };
  
  function storeRates(symbol, rate) {
    console.log(`${taskName} STORING_RATE: ${symbol} - $${rate}`);
    // ctx.storage.get((err, data) => {
    //   if (err) {
    //     console.log(`${taskName} GET_RATE_STORE_ERROR:`);
    //     console.log(err);
    //     cb(null, err);
    //   }
    //   let store = data || {};
    //   store.rates[symbol] = rate;
    //   ctx.storage.set(store, err => {
    //     if (err) {
    //       console.log(`${taskName} UPDATE_RATE_STORE_ERROR:`);
    //       console.log(err);
    //       cb(null, err);
    //     }
    //     getRates(store);
    //   });
    // });
  };
  
  async function getRates(groupNumber) {
    const symbolsLen = symbols.length;
    const symbolsGroup0 = symbols.slice(0, 10);
    const symbolsGroup1 = symbols.slice(10, 20);
    const symbolsGroup2 = symbols.slice(20, symbolsLen);
    
    const buildRates = () => {
      return new Promise((resolve, reject) => {
        async.mapValues(symbolsGroup0, (symbol, key, acb) => {
          console.log(`${taskName} GETTING_RATE: ${symbol}`);
          bfxRest.ticker(symbol, (err, res) => {
            if (err) {
              acb(err);
            }
            const rate = res.last_price;
            acb(null, rate);
          })
        }, (err, results) => {
          if (err) {
            console.log(`${taskName} GET_RATE_ERROR:`);
            console.log(err);
            reject(err);
          }
          let newRatesObj = {};
          _.forEach(results, (value, key) => {
            const symbol = symbolsGroup0[key];
            newRatesObj[symbol] = value;
          });
          console.log(newRatesObj);
          resolve(newRatesObj);
        });
      })
    };
    
    let store = await getStore();
    store.rates = await buildRates();
    
    setStore(store).then((res) => {
      cb(null, res);
    });
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
        if (data.rates === {}) {
          console.log(`${taskName} RATE_STORE_EMPTY`);
          cb(null, 'RATE_STORE_EMPTY');
        }
        else {
          console.log(`${taskName} GOT_RATE_STORE`);
          buildBalance(res, data.rates);
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
