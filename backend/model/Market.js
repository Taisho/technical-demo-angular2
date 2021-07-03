let db;
db = require('../database');
const tableName = 'markets';

function Market(input) {
    if(input == undefined) {
        this.id = 0;
        this.asset = null;
        this.base = null;
    }
    else {
        this.id = input.id
        this.asset = input.asset;
        this.base = input.base;
    }
}


Market.find = function(asset, base) {

    db.dbHandler.serialize(function() {
        db.dbHandler.get("SELECT * FROM markets WHERE asset = ? AND base = ?", [asset, base], (err, result) => {
            callback(result);
        });
    })
}

Market.fetch = function(callback) {
    let query = db.buildQueryFromOptions(tableName, null);
    db.dbHandler.serialize(function() {
        db.dbHandler.all(query, (error, result) => {
            let blessedResult = [];
            let blessedInstance;
            console.log("Market.js. Fetched markets: ", result);
            console.log("Market.js. Markets' query: ", query);
            for(let row of result) {
                blessedInstance = new Market(row);
                blessedResult.push(blessedInstance);
            }
            callback(blessedResult);
        });
    })
}

module.exports.Market = Market;