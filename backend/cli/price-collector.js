//require('dotenv').config;
const fs = require('fs');
const path = require('path');
const db = require(path.resolve( '../database'));
const filesystem = require(path.resolve('../filesystem'));
const ccxt = require('ccxt');
const axios = require('axios');
const {Market} = require('../model/Market');
const {Price} = require('../model/Price');
const {Asset} = require('../model/Asset');
const {makeStateKey} = require('@angular/platform-browser');
const { HourlyPrice } = require('../model/HourlyPrice');

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

/**
 *  Fetches historical price data for markets from CoinGecko. This should play nicely with the data that we collect in "real-time"
 *  (in actuality updated every minute, far from being "real-time", but anyway).
 * 
 */
async function syncHistoricalPriceData() {
    let market_chart;
    let daysAgo = 90;

    console.log('MARKETS: ', markets);
    for(let market of markets) {
        
        let query = 'https://api.coingecko.com/api/v3/coins/'+market.asset+'/market_chart?vs_currency='+market.base+'&days='+daysAgo;
        console.log("Market_Chart query: ", query);
        market_chart = await axios.get(query);
        market_chart = market_chart.data;
        // Now $market_chart contains hourly data. It is "condensed", meaning we've got a single price value for that hour -
        // there are no open/close or top/bottom values. Potentially we could have finer data in the database. We don't
        // want to blindly substitute data in the database with the data we just fetched from Coingecko.
        // On the other hand we can use $market_chart to expand our daily data (i.e. to have open/close, top/bottom price values),
        // if it's not already expanded

        // the result from CoinGecko is ordered such as the first element is the oldest price (as expected and the same way
        // we store price history)
        
        HourlyPrice.fetchLastHourData(market.id, (err, lastHourData) => {
            if(err != null) {
                console.error("ERROR: ", err);
                return;
            }
            // $market_chart dictates the timestamp
            // this means inside tick() we need to regularly call market_chart API in order to keep the database in sync
            // 1625226282960
            for(let priceAtHour of market_chart.prices) {
                let price = priceAtHour[1];
                let hour = priceAtHour[0];

                //let priceMomentFound = false;
                console.log("price entry: ", priceAtHour);
                if(lastHourData.timestamp < hour) {
                    let priceEntry = new HourlyPrice({
                        market: market.id,
                        condensed: true,
                        date: null,
                        timestamp: hour,
                        priceOpen: 0,
                        priceClose: price,
                        priceBottom: 0,
                        priceTop: 0,
                    });
                    console.log("Saving");
                    priceEntry.save();
                }
                // for(let priceRow of dataInDatabase) {
                //     if(priceRow.timestamp == hour) {
                //         break;
                //     }
                // }
            }
        });
    }
}

const tick = async() => {
    const result = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids='+assedIds+'&vs_currencies='+baseCurrency+
    '&include_last_updated_at=true');

    for(let k in result.data) {
        console.log("Market "+k+"/"+baseCurrency+"| Price per asset: "+result.data[k][baseCurrency]);
    }
}

function run(){
    if(markets == null) {
        console.log("Markets not fetched from database. Waiting for database...\n");
        setTimeout(run, 1000);
        return;
    }

    /**
     * 1. Make sure the price data we have in the database is integral. Fill any gaps that are present. Be careful with 
     *    row removals. Assuming price-collector is running 24/7 it would have finer data than what would CoinGecko return
     *    for historical data.
     *    For now design the price collection around CoinGecko limitations:
     *      a) Make sure we have hourly data for the past 90 days
     *      b) Make sure we have minutely data for the past 24 hours
     *      c) 
     */

    syncHistoricalPriceData();

    /** Get real-time data */
    //tick();
    //let intervalHandler = setInterval(tick, 2000);
};

/* const stop = (intervalH) => {
    clearInterval(intervalH);
} */

run();
//module.exports.run = run;