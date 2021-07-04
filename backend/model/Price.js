let db;
db = require('../database');
const tableName = null;

function Price(input) {
    if(input == undefined) {
        this.id = 0;
        this.market = null;
        this.condensed = true;
        this.date = null;
        this.timestamp = 0;
        this.priceOpen = 0;
        this.priceClose = 0;
        this.priceBottom = 0;
        this.priceTop = 0;
    }
    else {
        this.id = input.id;
        this.market = input.market;
        this.condensed = input.condensed;
        this.date = input.date;
        this.timestamp = input.timestamp;
        this.priceOpen = input.priceOpen;
        this.priceClose = input.priceClose;
        this.priceBottom = input.priceBottom;
        this.priceTop = input.priceTop;
    }
}


module.exports.Price = Price;