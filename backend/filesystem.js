const path = require('path');
const fs = require('fs');

function ensureExists(path, mask, cb) {


    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0o777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

const appDir = __dirname;
const dataDir = __dirname+path.sep+'data';

module.exports.ensureExists = ensureExists;
module.exports.appDir = appDir;
module.exports.dataDir = dataDir;
