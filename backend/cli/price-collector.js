//require('dotenv').config;
const fs = require('fs');
const path = require('path');
const db = require(path.resolve( '../database'));
const filesystem = require(path.resolve('../filesystem'));
const ccxt = require('ccxt');
const axios = require('axios');
const {Market} = require('../model/Market');
const {Asset} = require('../model/Asset');

let assedIds = '';
const baseCurrency = 'usd';
let markets;

filesystem.ensureExists(filesystem.appDir, function () {
    db.initDb(filesystem.appDir, filesystem.dataDir);
    Market.fetch(result => {
        markets = result;

        for(let m of markets) {
            assedIds += m.asset+',';
        }
        assedIds = assedIds.substr(0, assedIds.length-1);
    })
})

const tick = async() => {
    const result = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids='+assedIds+'&vs_currencies='+baseCurrency+
    '&include_last_updated_at=true');

    for(let k in result.data) {
        console.log("Market "+k+"/"+baseCurrency+"| Price per asset: "+result.data[k][baseCurrency]);
    }
}

const run = () => {
    if(markets == null) {
        console.log("Markets not fetched from database. Waiting for database...\n");
        setTimeout(run, 1000);
        return;
    }

    tick();
    let intervalHandler = setInterval(tick, 2000);
};

const stop = (intervalH) => {
    clearInterval(intervalH);
}

run();
//module.exports.run = run;