let db;
db = require('../database');
const {Price} = require('./Price');
const tableName = 'hourly_prices';

function HourlyPrice(input) {
    this.__proto__.__proto__ = Price.prototype;
    Price.call(this, input);
}
module.exports.HourlyPrice = HourlyPrice;
HourlyPrice.prototype.tableName = tableName;

HourlyPrice.prototype.save = function() {
    db.dbHandler.serialize(() => {
        let stmt = db.dbHandler.prepare("INSERT INTO "+tableName+" (market, condensed, timestamp, priceOpen, priceClose, priceBottom, priceTop) VALUES (?,?,?,?,?,?,?)")
        console.log("Running prepare statement: ", this.market, this.condensed, this.timestamp);
        stmt.run(
            this.market,
            this.condensed,
            this.timestamp,
            this.priceOpen,
            this.priceClose,
            this.priceBottom,
            this.priceTop,
        );

        stmt.finalize();
    })
}

HourlyPrice.factory = function(list) {
    if(list == null)
        return [];

    let resultList = list.map(o => {
        return new HourlyPrice(o);
    })

    return resultList;
}

HourlyPrice.fetchLastHourData = function(marketId, callback) {
    const date = new Date();
    let timestamp = date.getTime();

    db.dbHandler.serialize(function() {
        let query = "SELECT * FROM "+tableName+" WHERE id = (SELECT MAX(id) FROM "+tableName+") AND market = ?";

        db.dbHandler.get(query, [marketId], (err, result) => {
            let blessedResult = new HourlyPrice(result);
            callback(err, blessedResult);
        });
    })
}

/**
 * Untested. Potentially buggy!
 * 
 * @param {*} marketId 
 * @param {*} daysAgo 
 * @param {*} callback 
 */
HourlyPrice.fetchLastDaysData = function(marketId, daysAgo, callback) {
    const date = new Date();
    let timestamp = date.getTime();

    db.dbHandler.serialize(function() {
        db.dbHandler.all("SELECT * FROM "+tableName+" WHERE `timestamp` > ?", [timestamp], (err, result) => {
            let blessedResult = HourlyPrice.factory(result);
            callback(err, blessedResult);
        });
    })
}